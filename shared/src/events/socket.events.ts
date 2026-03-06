export const SOCKET_EVENTS = {
  // Connection
  JOIN_MATCH: 'match:join',
  LEAVE_MATCH: 'match:leave',

  // Game flow
  GAME_STATE: 'game:state',
  QUESTION_NEW: 'game:question',
  ANSWER_SUBMIT: 'game:answer',
  ROUND_RESULT: 'game:round-result',
  ROPE_UPDATE: 'game:rope-update',
  GAME_END: 'game:end',
  TIMER_UPDATE: 'game:timer',

  // Lobby
  LOBBY_UPDATE: 'lobby:update',
  MATCH_START: 'match:start',
  PLAYER_READY: 'player:ready',

  // QR Session
  QR_SESSION_CREATE: 'qr:create',
  QR_SESSION_JOIN: 'qr:join',
  QR_SESSION_LINKED: 'qr:linked',

  // Errors
  ERROR: 'error',
} as const;

export type SocketEvent = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];
