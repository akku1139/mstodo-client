import { describe, it, expect, beforeEach } from 'vitest';
import { changeLanguage, getCurrentLanguage } from './index';
import i18n from './index';

describe('i18n', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset to default language
    i18n.changeLanguage('en');
  });

  describe('changeLanguage', () => {
    it('言語を英語に変更できる', () => {
      changeLanguage('en');
      expect(i18n.language).toBe('en');
      expect(localStorage.getItem('app_language')).toBe('en');
    });

    it('言語を日本語に変更できる', () => {
      changeLanguage('ja');
      expect(i18n.language).toBe('ja');
      expect(localStorage.getItem('app_language')).toBe('ja');
    });
  });

  describe('getCurrentLanguage', () => {
    it('現在の言語を取得できる（英語）', () => {
      i18n.changeLanguage('en');
      expect(getCurrentLanguage()).toBe('en');
    });

    it('現在の言語を取得できる（日本語）', () => {
      i18n.changeLanguage('ja');
      expect(getCurrentLanguage()).toBe('ja');
    });
  });

  describe('translations', () => {
    it('英語の翻訳が正しく取得できる', () => {
      i18n.changeLanguage('en');
      expect(i18n.t('app.title')).toBe('Microsoft To Do');
      expect(i18n.t('app.loading')).toBe('Loading...');
      expect(i18n.t('auth.signIn')).toBe('Sign in with Microsoft');
      expect(i18n.t('lists.today')).toBe('Today');
      expect(i18n.t('tasks.addTask')).toBe('Add a new task...');
    });

    it('日本語の翻訳が正しく取得できる', () => {
      i18n.changeLanguage('ja');
      expect(i18n.t('app.title')).toBe('Microsoft To Do');
      expect(i18n.t('app.loading')).toBe('読み込み中...');
      expect(i18n.t('auth.signIn')).toBe('Microsoft でサインイン');
      expect(i18n.t('lists.today')).toBe('今日');
      expect(i18n.t('tasks.addTask')).toBe('新しいタスクを追加...');
    });

    it('プレースホルダーが正しく置換される', () => {
      i18n.changeLanguage('en');
      expect(i18n.t('tasks.activeTasks', { count: 5 })).toBe('5 active tasks');
      expect(i18n.t('tasks.activeTasks', { count: 1 })).toBe('1 active task');
      
      i18n.changeLanguage('ja');
      expect(i18n.t('tasks.activeTasks', { count: 5 })).toBe('5件の未完了タスク');
      expect(i18n.t('tasks.activeTasks', { count: 1 })).toBe('1件の未完了タスク');
    });

    it('URLプレースホルダーが正しく置換される', () => {
      i18n.changeLanguage('en');
      expect(i18n.t('deviceCode.step1', { url: 'https://example.com' }))
        .toBe('Open https://example.com');
      
      i18n.changeLanguage('ja');
      expect(i18n.t('deviceCode.step1', { url: 'https://example.com' }))
        .toBe('https://example.com を開く');
    });

    it('分プレースホルダーが正しく置換される', () => {
      i18n.changeLanguage('en');
      expect(i18n.t('deviceCode.expiresIn', { minutes: 15 }))
        .toBe('Code expires in 15 minutes');
      
      i18n.changeLanguage('ja');
      expect(i18n.t('deviceCode.expiresIn', { minutes: 15 }))
        .toBe('コードの有効期限: 15分');
    });
  });

  describe('language persistence', () => {
    it('言語設定がローカルストレージに保存される', () => {
      changeLanguage('ja');
      expect(localStorage.getItem('app_language')).toBe('ja');
      
      changeLanguage('en');
      expect(localStorage.getItem('app_language')).toBe('en');
    });
  });
});
