/**
 * Local SQLite storage for guest/unauthenticated users.
 * All guest data (matches, answers, homework, chat) stays on-device until
 * the guest links to a parent account, at which point it is batch-migrated
 * to the backend and then deleted from this database.
 */
import * as SQLite from 'expo-sqlite';

const TAG = '[guestDb]';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function openDb(): Promise<SQLite.SQLiteDatabase> {
  console.log(`${TAG} openDatabaseAsync start`);
  try {
    const database = await SQLite.openDatabaseAsync('guestData.db');
    console.log(`${TAG} openDatabaseAsync success, running schema`);
    await database.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS guest_matches (
        id TEXT PRIMARY KEY,
        subject TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        game_mode TEXT NOT NULL,
        max_rounds INTEGER NOT NULL,
        context TEXT,
        language TEXT,
        status TEXT NOT NULL DEFAULT 'IN_PROGRESS',
        winner TEXT,
        rounds_played INTEGER NOT NULL DEFAULT 0,
        score_left INTEGER NOT NULL DEFAULT 0,
        score_right INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS guest_questions (
        id TEXT PRIMARY KEY,
        match_id TEXT NOT NULL,
        text TEXT NOT NULL,
        options_json TEXT NOT NULL,
        correct_index INTEGER NOT NULL,
        subject TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        explanation TEXT NOT NULL DEFAULT ''
      );
      CREATE TABLE IF NOT EXISTS guest_answers (
        id TEXT PRIMARY KEY,
        match_id TEXT NOT NULL,
        question_id TEXT,
        player_id TEXT NOT NULL,
        team_side TEXT NOT NULL,
        answer_index INTEGER NOT NULL,
        is_correct INTEGER NOT NULL,
        response_time REAL NOT NULL,
        round INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS guest_homework_sessions (
        id TEXT PRIMARY KEY,
        title TEXT,
        subject TEXT,
        status TEXT NOT NULL DEFAULT 'READY',
        topics_json TEXT NOT NULL DEFAULT '[]',
        answers_markdown TEXT,
        image_base64 TEXT NOT NULL,
        image_mime_type TEXT NOT NULL DEFAULT 'image/jpeg',
        error_message TEXT,
        quiz_taken INTEGER NOT NULL DEFAULT 0,
        linked_match_ids_json TEXT NOT NULL DEFAULT '[]',
        created_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS guest_homework_chats (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS guest_corrections (
        id TEXT PRIMARY KEY,
        match_id TEXT NOT NULL,
        round INTEGER NOT NULL,
        question_text TEXT NOT NULL,
        options_json TEXT NOT NULL,
        correct_index INTEGER NOT NULL,
        explanation TEXT NOT NULL DEFAULT '',
        user_answer_index INTEGER NOT NULL,
        is_correct INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS child_profiles (
        id TEXT PRIMARY KEY,
        display_name TEXT NOT NULL,
        avatar_url TEXT NOT NULL DEFAULT '',
        grade TEXT NOT NULL DEFAULT '',
        updated_at INTEGER NOT NULL
      );
    `);
    // Migrations for existing databases (no-op if columns already exist)
    try { await database.execAsync('ALTER TABLE guest_matches ADD COLUMN score_left INTEGER NOT NULL DEFAULT 0'); } catch { /* already exists */ }
    try { await database.execAsync('ALTER TABLE guest_matches ADD COLUMN score_right INTEGER NOT NULL DEFAULT 0'); } catch { /* already exists */ }

    console.log(`${TAG} schema ready`);
    return database;
  } catch (err) {
    console.error(`${TAG} openDb FAILED:`, err);
    dbPromise = null; // allow retry
    throw err;
  }
}

export function initGuestDb(): Promise<void> {
  if (!dbPromise) dbPromise = openDb();
  return dbPromise.then(() => {});
}

async function getDbAsync(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) dbPromise = openDb();
  return dbPromise;
}

// ─── Matches ──────────────────────────────────────────────────────────────────

export interface GuestMatch {
  _id: string;
  subject: string;
  difficulty: string;
  gameMode: string;
  maxRounds: number;
  context?: string;
  language?: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
  winner?: string;
  roundsPlayed: number;
  scoreLeft: number;
  scoreRight: number;
  createdAt: number;
}

export async function saveMatch(match: GuestMatch): Promise<void> {
  console.log(`${TAG} saveMatch`, match._id);
  try {
    await (await getDbAsync()).runAsync(
      `INSERT OR REPLACE INTO guest_matches
        (id, subject, difficulty, game_mode, max_rounds, context, language, status, winner, rounds_played, score_left, score_right, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [match._id, match.subject, match.difficulty, match.gameMode, match.maxRounds,
       match.context ?? null, match.language ?? null, match.status,
       match.winner ?? null, match.roundsPlayed,
       match.scoreLeft ?? 0, match.scoreRight ?? 0, match.createdAt],
    );
    console.log(`${TAG} saveMatch OK`, match._id);
  } catch (err) {
    console.error(`${TAG} saveMatch FAILED`, match._id, err);
    throw err;
  }
}

export async function updateMatch(id: string, updates: Partial<GuestMatch>): Promise<void> {
  console.log(`${TAG} updateMatch`, id, updates);
  try {
    const parts: string[] = [];
    const values: (string | number | null)[] = [];
    if (updates.status !== undefined) { parts.push('status = ?'); values.push(updates.status); }
    if (updates.winner !== undefined) { parts.push('winner = ?'); values.push(updates.winner ?? null); }
    if (updates.roundsPlayed !== undefined) { parts.push('rounds_played = ?'); values.push(updates.roundsPlayed); }
    if (updates.scoreLeft !== undefined) { parts.push('score_left = ?'); values.push(updates.scoreLeft); }
    if (updates.scoreRight !== undefined) { parts.push('score_right = ?'); values.push(updates.scoreRight); }
    if (parts.length === 0) return;
    values.push(id);
    await (await getDbAsync()).runAsync(`UPDATE guest_matches SET ${parts.join(', ')} WHERE id = ?`, values);
    console.log(`${TAG} updateMatch OK`, id);
  } catch (err) {
    console.error(`${TAG} updateMatch FAILED`, id, err);
    throw err;
  }
}

export async function getMatches(): Promise<GuestMatch[]> {
  console.log(`${TAG} getMatches`);
  try {
    const rows = await (await getDbAsync()).getAllAsync<any>(
      'SELECT * FROM guest_matches ORDER BY created_at DESC',
    );
    console.log(`${TAG} getMatches OK, count=${rows.length}`);
    return rows.map(rowToMatch);
  } catch (err) {
    console.error(`${TAG} getMatches FAILED`, err);
    throw err;
  }
}

export async function getMatch(id: string): Promise<GuestMatch | null> {
  console.log(`${TAG} getMatch`, id);
  try {
    const row = await (await getDbAsync()).getFirstAsync<any>('SELECT * FROM guest_matches WHERE id = ?', [id]);
    console.log(`${TAG} getMatch OK`, id, row ? 'found' : 'not found');
    return row ? rowToMatch(row) : null;
  } catch (err) {
    console.error(`${TAG} getMatch FAILED`, id, err);
    throw err;
  }
}

export async function getCompletedMatchesCount(): Promise<number> {
  try {
    const row = await (await getDbAsync()).getFirstAsync<any>("SELECT COUNT(*) as count FROM guest_matches WHERE status = 'COMPLETED'");
    return row?.count || 0;
  } catch (err) {
    console.error(`${TAG} getCompletedMatchesCount FAILED`, err);
    return 0;
  }
}

function rowToMatch(r: any): GuestMatch {
  return {
    _id: r.id, subject: r.subject, difficulty: r.difficulty,
    gameMode: r.game_mode, maxRounds: r.max_rounds,
    context: r.context ?? undefined, language: r.language ?? undefined,
    status: r.status, winner: r.winner ?? undefined,
    roundsPlayed: r.rounds_played,
    scoreLeft: r.score_left ?? 0, scoreRight: r.score_right ?? 0,
    createdAt: r.created_at,
  };
}

// ─── Questions ────────────────────────────────────────────────────────────────

export interface GuestQuestion {
  id: string;
  matchId: string;
  text: string;
  options: string[];
  correctIndex: number;
  subject: string;
  difficulty: string;
  explanation: string;
}

export async function saveQuestions(matchId: string, questions: any[]): Promise<void> {
  console.log(`${TAG} saveQuestions matchId=${matchId} count=${questions.length}`);
  try {
    const d = await getDbAsync();
    for (const q of questions) {
      await d.runAsync(
        `INSERT OR REPLACE INTO guest_questions
          (id, match_id, text, options_json, correct_index, subject, difficulty, explanation)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [q.id ?? q._id, matchId, q.text,
         JSON.stringify(q.options), q.correctIndex, q.subject, q.difficulty, q.explanation ?? ''],
      );
    }
    console.log(`${TAG} saveQuestions OK`);
  } catch (err) {
    console.error(`${TAG} saveQuestions FAILED`, matchId, err);
    throw err;
  }
}

export async function getQuestions(matchId: string): Promise<GuestQuestion[]> {
  console.log(`${TAG} getQuestions`, matchId);
  try {
    const rows = await (await getDbAsync()).getAllAsync<any>(
      'SELECT * FROM guest_questions WHERE match_id = ?', [matchId],
    );
    console.log(`${TAG} getQuestions OK, count=${rows.length}`);
    return rows.map((r) => ({
      id: r.id, matchId: r.match_id, text: r.text,
      options: JSON.parse(r.options_json), correctIndex: r.correct_index,
      subject: r.subject, difficulty: r.difficulty, explanation: r.explanation,
    }));
  } catch (err) {
    console.error(`${TAG} getQuestions FAILED`, matchId, err);
    throw err;
  }
}

// ─── Answers ──────────────────────────────────────────────────────────────────

export interface GuestAnswer {
  id: string;
  matchId: string;
  questionId?: string;
  playerId: string;
  teamSide: string;
  answerIndex: number;
  isCorrect: boolean;
  responseTime: number;
  round: number;
  createdAt: number;
}

export async function saveAnswer(answer: GuestAnswer): Promise<void> {
  console.log(`${TAG} saveAnswer round=${answer.round} correct=${answer.isCorrect}`);
  try {
    await (await getDbAsync()).runAsync(
      `INSERT OR REPLACE INTO guest_answers
        (id, match_id, question_id, player_id, team_side, answer_index, is_correct, response_time, round, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [answer.id, answer.matchId, answer.questionId ?? null, answer.playerId,
       answer.teamSide, answer.answerIndex, answer.isCorrect ? 1 : 0,
       answer.responseTime, answer.round, answer.createdAt],
    );
    console.log(`${TAG} saveAnswer OK`);
  } catch (err) {
    console.error(`${TAG} saveAnswer FAILED`, err);
    throw err;
  }
}

export async function getAnswers(matchId: string): Promise<GuestAnswer[]> {
  console.log(`${TAG} getAnswers`, matchId);
  try {
    const rows = await (await getDbAsync()).getAllAsync<any>(
      'SELECT * FROM guest_answers WHERE match_id = ? ORDER BY created_at ASC', [matchId],
    );
    console.log(`${TAG} getAnswers OK, count=${rows.length}`);
    return rows.map((r) => ({
      id: r.id, matchId: r.match_id, questionId: r.question_id ?? undefined,
      playerId: r.player_id, teamSide: r.team_side, answerIndex: r.answer_index,
      isCorrect: r.is_correct === 1, responseTime: r.response_time,
      round: r.round, createdAt: r.created_at,
    }));
  } catch (err) {
    console.error(`${TAG} getAnswers FAILED`, matchId, err);
    throw err;
  }
}

// ─── Homework Sessions ────────────────────────────────────────────────────────

export interface GuestHomeworkSession {
  id: string;
  _id: string;
  title?: string;
  subject?: string;
  status: 'READY' | 'FAILED';
  topics: string[];
  answersMarkdown?: string;
  imageBase64: string;
  imageMimeType: string;
  errorMessage?: string;
  quizTaken: boolean;
  linkedMatchIds: string[];
  createdAt: number;
}

export async function saveHomeworkSession(session: Omit<GuestHomeworkSession, '_id'>): Promise<void> {
  console.log(`${TAG} saveHomeworkSession`, session.id);
  try {
    await (await getDbAsync()).runAsync(
      `INSERT OR REPLACE INTO guest_homework_sessions
        (id, title, subject, status, topics_json, answers_markdown, image_base64, image_mime_type,
         error_message, quiz_taken, linked_match_ids_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [session.id, session.title ?? null, session.subject ?? null, session.status,
       JSON.stringify(session.topics ?? []), session.answersMarkdown ?? null,
       session.imageBase64, session.imageMimeType,
       session.errorMessage ?? null, session.quizTaken ? 1 : 0,
       JSON.stringify(session.linkedMatchIds ?? []), session.createdAt],
    );
    console.log(`${TAG} saveHomeworkSession OK`, session.id);
  } catch (err) {
    console.error(`${TAG} saveHomeworkSession FAILED`, session.id, err);
    throw err;
  }
}

export async function updateHomeworkSession(id: string, updates: Partial<GuestHomeworkSession>): Promise<void> {
  console.log(`${TAG} updateHomeworkSession`, id, updates);
  try {
    const parts: string[] = [];
    const values: (string | number | null)[] = [];
    if (updates.status !== undefined) { parts.push('status = ?'); values.push(updates.status); }
    if (updates.title !== undefined) { parts.push('title = ?'); values.push(updates.title ?? null); }
    if (updates.quizTaken !== undefined) { parts.push('quiz_taken = ?'); values.push(updates.quizTaken ? 1 : 0); }
    if (updates.linkedMatchIds !== undefined) { parts.push('linked_match_ids_json = ?'); values.push(JSON.stringify(updates.linkedMatchIds)); }
    if (parts.length === 0) return;
    values.push(id);
    await (await getDbAsync()).runAsync(`UPDATE guest_homework_sessions SET ${parts.join(', ')} WHERE id = ?`, values);
    console.log(`${TAG} updateHomeworkSession OK`, id);
  } catch (err) {
    console.error(`${TAG} updateHomeworkSession FAILED`, id, err);
    throw err;
  }
}

export async function getHomeworkSessions(): Promise<GuestHomeworkSession[]> {
  console.log(`${TAG} getHomeworkSessions`);
  try {
    const rows = await (await getDbAsync()).getAllAsync<any>(
      'SELECT * FROM guest_homework_sessions ORDER BY created_at DESC',
    );
    console.log(`${TAG} getHomeworkSessions OK, count=${rows.length}`);
    return rows.map(rowToSession);
  } catch (err) {
    console.error(`${TAG} getHomeworkSessions FAILED`, err);
    throw err;
  }
}

export async function getHomeworkSession(id: string): Promise<GuestHomeworkSession | null> {
  console.log(`${TAG} getHomeworkSession`, id);
  try {
    const row = await (await getDbAsync()).getFirstAsync<any>(
      'SELECT * FROM guest_homework_sessions WHERE id = ?', [id],
    );
    console.log(`${TAG} getHomeworkSession OK`, id, row ? 'found' : 'not found');
    return row ? rowToSession(row) : null;
  } catch (err) {
    console.error(`${TAG} getHomeworkSession FAILED`, id, err);
    throw err;
  }
}

function rowToSession(r: any): GuestHomeworkSession {
  return {
    id: r.id, _id: r.id,
    title: r.title ?? undefined, subject: r.subject ?? undefined,
    status: r.status,
    topics: JSON.parse(r.topics_json ?? '[]'),
    answersMarkdown: r.answers_markdown ?? undefined,
    imageBase64: r.image_base64, imageMimeType: r.image_mime_type,
    errorMessage: r.error_message ?? undefined,
    quizTaken: r.quiz_taken === 1,
    linkedMatchIds: JSON.parse(r.linked_match_ids_json ?? '[]'),
    createdAt: r.created_at,
  };
}

// ─── Chat Messages ────────────────────────────────────────────────────────────

export interface GuestChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'model';
  content: string;
  createdAt: number;
}

export async function saveChatMessage(msg: GuestChatMessage): Promise<void> {
  console.log(`${TAG} saveChatMessage session=${msg.sessionId} role=${msg.role}`);
  try {
    await (await getDbAsync()).runAsync(
      `INSERT OR REPLACE INTO guest_homework_chats (id, session_id, role, content, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [msg.id, msg.sessionId, msg.role, msg.content, msg.createdAt],
    );
    console.log(`${TAG} saveChatMessage OK`);
  } catch (err) {
    console.error(`${TAG} saveChatMessage FAILED`, err);
    throw err;
  }
}

export async function getChatHistory(sessionId: string): Promise<GuestChatMessage[]> {
  console.log(`${TAG} getChatHistory`, sessionId);
  try {
    const rows = await (await getDbAsync()).getAllAsync<any>(
      'SELECT * FROM guest_homework_chats WHERE session_id = ? ORDER BY created_at ASC', [sessionId],
    );
    console.log(`${TAG} getChatHistory OK, count=${rows.length}`);
    return rows.map((r) => ({
      id: r.id, sessionId: r.session_id, role: r.role,
      content: r.content, createdAt: r.created_at,
    }));
  } catch (err) {
    console.error(`${TAG} getChatHistory FAILED`, sessionId, err);
    throw err;
  }
}

// ─── Corrections ──────────────────────────────────────────────────────────────

export interface GuestCorrection {
  id: string;
  matchId: string;
  round: number;
  questionText: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  userAnswerIndex: number; // -1 = timeout/skipped
  isCorrect: boolean;
}

export async function saveCorrection(correction: GuestCorrection): Promise<void> {
  try {
    await (await getDbAsync()).runAsync(
      `INSERT OR REPLACE INTO guest_corrections
        (id, match_id, round, question_text, options_json, correct_index, explanation, user_answer_index, is_correct)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [correction.id, correction.matchId, correction.round, correction.questionText,
       JSON.stringify(correction.options), correction.correctIndex, correction.explanation,
       correction.userAnswerIndex, correction.isCorrect ? 1 : 0],
    );
  } catch (err) {
    console.error(`${TAG} saveCorrection FAILED`, err);
    throw err;
  }
}

export async function getCorrections(matchId: string): Promise<GuestCorrection[]> {
  try {
    const rows = await (await getDbAsync()).getAllAsync<any>(
      'SELECT * FROM guest_corrections WHERE match_id = ? ORDER BY round ASC', [matchId],
    );
    return rows.map((r) => ({
      id: r.id, matchId: r.match_id, round: r.round,
      questionText: r.question_text, options: JSON.parse(r.options_json),
      correctIndex: r.correct_index, explanation: r.explanation,
      userAnswerIndex: r.user_answer_index, isCorrect: r.is_correct === 1,
    }));
  } catch (err) {
    console.error(`${TAG} getCorrections FAILED`, matchId, err);
    throw err;
  }
}

// ─── Child Profile (Cached) ───────────────────────────────────────────────────

export interface CachedChildProfile {
  id: string;
  displayName: string;
  avatarUrl: string;
  grade: string;
  updatedAt: number;
}

export async function saveChildProfile(profile: { id: string; displayName: string; avatarUrl?: string; grade?: string }): Promise<void> {
  console.log(`${TAG} saveChildProfile`, profile.id);
  try {
    await (await getDbAsync()).runAsync(
      `INSERT OR REPLACE INTO child_profiles (id, display_name, avatar_url, grade, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      [profile.id, profile.displayName, profile.avatarUrl ?? '', profile.grade ?? '', Date.now()],
    );
    console.log(`${TAG} saveChildProfile OK`);
  } catch (err) {
    console.error(`${TAG} saveChildProfile FAILED`, err);
    throw err;
  }
}

export async function getChildProfile(id: string): Promise<CachedChildProfile | null> {
  console.log(`${TAG} getChildProfile`, id);
  try {
    const row = await (await getDbAsync()).getFirstAsync<any>(
      'SELECT * FROM child_profiles WHERE id = ?', [id]
    );
    if (!row) return null;
    return {
      id: row.id,
      displayName: row.display_name,
      avatarUrl: row.avatar_url,
      grade: row.grade,
      updatedAt: row.updated_at,
    };
  } catch (err) {
    console.error(`${TAG} getChildProfile FAILED`, id, err);
    throw err;
  }
}

// ─── Profile stats (for leaderboard / profile view) ──────────────────────────

export interface GuestProfileStats {
  gamesPlayed: number;
  correctAnswers: number;
  totalAnswers: number;
  accuracy: number;
  subjectStats: Array<{
    subject: string;
    correctAnswers: number;
    totalQuestions: number;
    accuracy: number;
  }>;
  recentMatches: Array<{
    matchId: string;
    subject: string;
    difficulty: string;
    date: number;
    gameMode: string;
    correctAnswers: number;
    totalQuestions: number;
    accuracy: number;
    didWin: boolean;
  }>;
}

export async function getGuestProfileStats(): Promise<GuestProfileStats> {
  console.log(`${TAG} getGuestProfileStats`);
  try {
    const db = await getDbAsync();
    const [completedMatches, allAnswers] = await Promise.all([
      db.getAllAsync<any>("SELECT * FROM guest_matches WHERE status = 'COMPLETED' ORDER BY created_at DESC"),
      db.getAllAsync<any>('SELECT * FROM guest_answers'),
    ]);

    const gamesPlayed = completedMatches.length;
    const totalCorrect = allAnswers.filter((a: any) => a.is_correct === 1).length;
    const totalAnswers = allAnswers.length;
    const accuracy = totalAnswers > 0 ? Math.round((totalCorrect / totalAnswers) * 100) : 0;

    // Per-subject aggregation
    const subjectMap = new Map<string, { correct: number; total: number }>();
    for (const match of completedMatches) {
      const matchAnswers = allAnswers.filter((a: any) => a.match_id === match.id);
      const existing = subjectMap.get(match.subject) ?? { correct: 0, total: 0 };
      existing.correct += matchAnswers.filter((a: any) => a.is_correct === 1).length;
      existing.total += matchAnswers.length;
      subjectMap.set(match.subject, existing);
    }
    const subjectStats = Array.from(subjectMap.entries()).map(([subject, { correct, total }]) => ({
      subject,
      correctAnswers: correct,
      totalQuestions: total,
      accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
    }));

    // Recent matches (up to 5)
    const recentMatches = completedMatches.slice(0, 5).map((match: any) => {
      const matchAnswers = allAnswers.filter((a: any) => a.match_id === match.id);
      const matchCorrect = matchAnswers.filter((a: any) => a.is_correct === 1).length;
      const matchTotal = matchAnswers.length;
      const matchAccuracy = matchTotal > 0 ? Math.round((matchCorrect / matchTotal) * 100) : 0;
      return {
        matchId: match.id,
        subject: match.subject,
        difficulty: match.difficulty,
        date: match.created_at,
        gameMode: match.game_mode,
        correctAnswers: matchCorrect,
        totalQuestions: matchTotal,
        accuracy: matchAccuracy,
        didWin: match.winner != null,
      };
    });

    console.log(`${TAG} getGuestProfileStats OK gamesPlayed=${gamesPlayed} correct=${totalCorrect}`);
    return { gamesPlayed, correctAnswers: totalCorrect, totalAnswers, accuracy, subjectStats, recentMatches };
  } catch (err) {
    console.error(`${TAG} getGuestProfileStats FAILED`, err);
    throw err;
  }
}

// ─── Migration helpers ────────────────────────────────────────────────────────

export async function getAllDataForMigration() {
  console.log(`${TAG} getAllDataForMigration`);
  try {
    const d = await getDbAsync();
    const [matches, questions, answers, corrections, homeworkSessions, chats] = await Promise.all([
      d.getAllAsync<any>('SELECT * FROM guest_matches'),
      d.getAllAsync<any>('SELECT * FROM guest_questions'),
      d.getAllAsync<any>('SELECT * FROM guest_answers'),
      d.getAllAsync<any>('SELECT * FROM guest_corrections'),
      d.getAllAsync<any>('SELECT * FROM guest_homework_sessions'),
      d.getAllAsync<any>('SELECT * FROM guest_homework_chats'),
    ]);
    console.log(`${TAG} getAllDataForMigration OK matches=${matches.length} hw=${homeworkSessions.length}`);
    return {
      matches: matches.map((r) => ({
        localId: r.id, subject: r.subject, difficulty: r.difficulty,
        gameMode: r.game_mode, maxRounds: r.max_rounds,
        status: r.status, winner: r.winner, roundsPlayed: r.rounds_played,
        createdAt: r.created_at,
      })),
      questions: questions.map((r) => ({
        localId: r.id, matchLocalId: r.match_id, text: r.text,
        options: JSON.parse(r.options_json), correctIndex: r.correct_index,
        subject: r.subject, difficulty: r.difficulty, explanation: r.explanation,
      })),
      answers: answers.map((r) => ({
        matchLocalId: r.match_id, questionLocalId: r.question_id,
        playerId: r.player_id, teamSide: r.team_side, answerIndex: r.answer_index,
        isCorrect: r.is_correct === 1, responseTime: r.response_time,
        round: r.round, createdAt: r.created_at,
      })),
      corrections: corrections.map((r) => ({
        matchLocalId: r.match_id, round: r.round,
        questionText: r.question_text, options: JSON.parse(r.options_json),
        correctIndex: r.correct_index, explanation: r.explanation,
        userAnswerIndex: r.user_answer_index, isCorrect: r.is_correct === 1,
      })),
      homeworkSessions: homeworkSessions.map((r) => ({
        localId: r.id, title: r.title, subject: r.subject, status: r.status,
        topics: JSON.parse(r.topics_json ?? '[]'),
        answersMarkdown: r.answers_markdown,
        imageBase64: r.image_base64, imageMimeType: r.image_mime_type,
        linkedMatchIds: JSON.parse(r.linked_match_ids_json ?? '[]'),
        createdAt: r.created_at,
      })),

      chats: chats.map((r) => ({
        sessionLocalId: r.session_id, role: r.role,
        content: r.content, createdAt: r.created_at,
      })),
    };
  } catch (err) {
    console.error(`${TAG} getAllDataForMigration FAILED`, err);
    throw err;
  }
}

export async function clearAllGuestData(): Promise<void> {
  console.log(`${TAG} clearAllGuestData`);
  try {
    const d = await getDbAsync();
    await d.execAsync('DELETE FROM guest_matches');
    await d.execAsync('DELETE FROM guest_questions');
    await d.execAsync('DELETE FROM guest_answers');
    await d.execAsync('DELETE FROM guest_corrections');
    await d.execAsync('DELETE FROM guest_homework_sessions');
    await d.execAsync('DELETE FROM guest_homework_chats');
    await d.execAsync('DELETE FROM child_profiles');
    console.log(`${TAG} clearAllGuestData OK`);
  } catch (err) {
    console.error(`${TAG} clearAllGuestData FAILED`, err);
    throw err;
  }
}

export async function syncFromBackend(payload: {
  matches: any[];
  homeworkSessions: any[];
  profile?: any;
}): Promise<void> {
  console.log(`${TAG} syncFromBackend matches=${payload.matches.length} hw=${payload.homeworkSessions.length} profile=${!!payload.profile}`);
  const d = await getDbAsync();
  // expo-sqlite's withTransactionAsync has a known bug in WAL mode where it
  // attempts ROLLBACK after a successful COMMIT, crashing with
  // "cannot rollback - no transaction is active". Use explicit statements instead.
  await d.execAsync('BEGIN TRANSACTION');
  try {
    // 1. Sync Matches
    for (const m of payload.matches) {
      await d.runAsync(
        `INSERT OR REPLACE INTO guest_matches
          (id, subject, difficulty, game_mode, max_rounds, status, winner, rounds_played, score_left, score_right, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          m._id,
          m.subject,
          m.difficulty,
          m.gameMode || 'solo',
          m.maxRounds || 10,
          m.status,
          m.winner || null,
          m.rounds || 0,
          m.teamScoreLeft || 0,
          m.teamScoreRight || 0,
          new Date(m.createdAt).getTime(),
        ],
      );
    }

    // 2. Sync Homework Sessions
    for (const s of payload.homeworkSessions) {
      await d.runAsync(
        `INSERT OR REPLACE INTO guest_homework_sessions
          (id, title, subject, status, topics_json, answers_markdown, image_base64, image_mime_type, quiz_taken, linked_match_ids_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          s._id,
          s.title || 'Homework',
          s.subject || null,
          s.status,
          JSON.stringify(s.topics || []),
          s.answersMarkdown || null,
          s.imageBase64 || '',
          s.imageMimeType || 'image/jpeg',
          s.quizTaken ? 1 : 0,
          JSON.stringify(s.linkedMatchIds || []),
          new Date(s.createdAt).getTime(),
        ],
      );
    }

    // 3. Sync Profile
    if (payload.profile) {
      await d.runAsync(
        `INSERT OR REPLACE INTO child_profiles (id, display_name, avatar_url, grade, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
        [
          payload.profile._id,
          payload.profile.displayName,
          payload.profile.avatarUrl || '',
          payload.profile.grade || '',
          Date.now(),
        ],
      );
    }

    await d.execAsync('COMMIT');
    console.log(`${TAG} syncFromBackend OK`);
  } catch (err) {
    try { await d.execAsync('ROLLBACK'); } catch { /* ignore secondary error */ }
    console.error(`${TAG} syncFromBackend FAILED`, err);
    throw err;
  }
}

