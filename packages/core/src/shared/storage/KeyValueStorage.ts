/**
 * 플랫폼별 저장소를 core 에서 쓰기 위한 인터페이스
 * - 웹: localStorage 로 구현 (apps/web)
 * - 모바일: AsyncStorage, SecureStore 등으로 구현
 * 모바일 저장소가 비동기라서 모든 메서드는 Promise 를 반환한다.
 */
export interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}
