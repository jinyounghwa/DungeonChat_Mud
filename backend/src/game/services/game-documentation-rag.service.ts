import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

interface DocumentSection {
  id: string;
  title: string;
  content: string;
  embedding?: number[];
}

interface SearchResult {
  section: DocumentSection;
  similarity: number;
}

@Injectable()
export class GameDocumentationRagService {
  private sections: DocumentSection[] = [];
  private embeddingsCache = new Map<string, number[]>();
  private ollamaUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434';
  private embeddingModel = process.env.OLLAMA_EMBEDDING_MODEL || 'mxbai-embed-large';
  private initialized = false;

  // 문자별로 최근에 반환한 섹션 ID를 추적하여 반복 방지
  private recentSectionsByCharacter = new Map<string, Set<string>>();
  private maxRecentSections = 10;

  /**
   * Initialize the RAG service by loading and embedding the game documentation
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await this.loadGameDocumentation();
      console.log(`✓ Loaded ${this.sections.length} sections from game documentation`);
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize GameDocumentationRagService:', error);
      throw error;
    }
  }

  /**
   * Load and parse the game documentation markdown file
   */
  private async loadGameDocumentation(): Promise<void> {
    const docPath = path.join(process.cwd(), 'GAME_DOCUMENTATION.md');

    if (!fs.existsSync(docPath)) {
      throw new Error(`Game documentation not found at ${docPath}`);
    }

    const content = fs.readFileSync(docPath, 'utf-8');
    this.sections = this.parseDocumentation(content);
  }

  /**
   * Parse markdown file into sections
   */
  private parseDocumentation(content: string): DocumentSection[] {
    const sections: DocumentSection[] = [];
    const lines = content.split('\n');
    let currentSection: Partial<DocumentSection> = {};
    let contentBuffer: string[] = [];

    for (const line of lines) {
      // Check for main section header (##)
      if (line.startsWith('## ')) {
        // Save previous section
        if (currentSection.title && contentBuffer.length > 0) {
          sections.push({
            id: this.generateSectionId(currentSection.title!),
            title: currentSection.title!,
            content: contentBuffer.join('\n').trim(),
          });
        }

        currentSection = {
          title: line.replace(/^## \s*/, '').trim(),
        };
        contentBuffer = [];
      } else if (currentSection.title) {
        // Add content to current section (stop at next main header)
        if (!line.startsWith('# ') && !line.startsWith('## ')) {
          contentBuffer.push(line);
        }
      }
    }

    // Add last section
    if (currentSection.title && contentBuffer.length > 0) {
      sections.push({
        id: this.generateSectionId(currentSection.title),
        title: currentSection.title,
        content: contentBuffer.join('\n').trim(),
      });
    }

    return sections;
  }

  /**
   * Generate a unique ID for section
   */
  private generateSectionId(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Get embedding for text using Ollama
   */
  private async getEmbedding(text: string): Promise<number[]> {
    // Check cache first
    if (this.embeddingsCache.has(text)) {
      return this.embeddingsCache.get(text)!;
    }

    try {
      const response = await axios.post(`${this.ollamaUrl}/api/embed`, {
        model: this.embeddingModel,
        input: text,
      });

      const embedding = response.data.embeddings?.[0];
      if (!embedding) {
        throw new Error('No embedding returned from Ollama');
      }

      // Cache the embedding
      this.embeddingsCache.set(text, embedding);
      return embedding;
    } catch (error) {
      console.error('Failed to get embedding:', error);
      throw error;
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      magnitudeA += vecA[i] * vecA[i];
      magnitudeB += vecB[i] * vecB[i];
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }

    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Search for relevant sections based on query
   * 반복되는 섹션을 피하고 다양한 결과 반환
   */
  async search(
    query: string,
    topK: number = 3,
    characterId?: string,
  ): Promise<SearchResult[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (this.sections.length === 0) {
      return [];
    }

    try {
      // Get embedding for query
      const queryEmbedding = await this.getEmbedding(query);

      // Calculate similarity for each section
      const results: SearchResult[] = [];
      const recentSections = characterId ? this.recentSectionsByCharacter.get(characterId) : undefined;

      for (const section of this.sections) {
        // 최근에 반환한 섹션 피하기
        if (recentSections && recentSections.has(section.id)) {
          continue;
        }

        // Get or create embedding for section
        let sectionEmbedding = section.embedding;
        if (!sectionEmbedding) {
          sectionEmbedding = await this.getEmbedding(section.content);
          section.embedding = sectionEmbedding;
        }

        const similarity = this.cosineSimilarity(queryEmbedding, sectionEmbedding);
        results.push({
          section,
          similarity,
        });
      }

      // Sort by similarity and return top K
      const selectedResults = results
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK);

      // 선택된 섹션을 최근 목록에 추가
      if (characterId) {
        if (!this.recentSectionsByCharacter.has(characterId)) {
          this.recentSectionsByCharacter.set(characterId, new Set());
        }
        const recentSet = this.recentSectionsByCharacter.get(characterId)!;
        selectedResults.forEach(r => recentSet.add(r.section.id));

        // 최대 크기 유지
        if (recentSet.size > this.maxRecentSections) {
          const sectionArray = Array.from(recentSet);
          // 가장 오래된 항목들 제거
          for (let i = 0; i < recentSet.size - this.maxRecentSections; i++) {
            recentSet.delete(sectionArray[i]);
          }
        }
      }

      return selectedResults;
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  }

  /**
   * Get relevant context for a game scenario
   * characterId를 전달받아 반복되는 결과 방지
   */
  async getContextForScenario(
    scenario: string,
    topK: number = 3,
    characterId?: string,
  ): Promise<string> {
    const results = await this.search(scenario, topK, characterId);

    if (results.length === 0) {
      return '';
    }

    const contextLines = results
      .filter((r) => r.similarity > 0.3) // Only include relevant sections
      .map(
        (r) =>
          `[${r.section.title}]\n${r.section.content}\n(관련도: ${(r.similarity * 100).toFixed(1)}%)`,
      );

    return contextLines.join('\n\n---\n\n');
  }

  /**
   * Get all available sections
   */
  getSections(): DocumentSection[] {
    return this.sections;
  }

  /**
   * Get section by ID
   */
  getSectionById(id: string): DocumentSection | undefined {
    return this.sections.find((s) => s.id === id);
  }

  /**
   * Get context for monster encounter
   */
  async getMonsterContext(monsterType: string, characterId?: string): Promise<string> {
    return this.getContextForScenario(`${monsterType} 몬스터 전투`, 2, characterId);
  }

  /**
   * Get context for floor/environment
   */
  async getFloorContext(floor: number, characterId?: string): Promise<string> {
    return this.getContextForScenario(`${floor}층 던전 환경`, 2, characterId);
  }

  /**
   * Get context for combat/battle
   */
  async getCombatContext(characterId?: string): Promise<string> {
    return this.getContextForScenario('전투 전투 시스템 공격 방어', 3, characterId);
  }

  /**
   * Get context for dialogue/conversation
   */
  async getDialogueContext(characterId?: string): Promise<string> {
    return this.getContextForScenario('대화 스타일 몬스터 대사', 2, characterId);
  }

  /**
   * Get context based on player action
   */
  async getContextForPlayerAction(action: string, characterId?: string): Promise<string> {
    return this.getContextForScenario(action, 3, characterId);
  }
}
