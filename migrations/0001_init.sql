-- Usuários: login pelo Google (google_sub) ou por e-mail e senha (password_hash).
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  google_sub TEXT UNIQUE,
  email TEXT UNIQUE,
  password_hash TEXT,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  invite_code TEXT NOT NULL UNIQUE,
  tz TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  tone TEXT NOT NULL DEFAULT 'provocador',
  theme TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
CREATE INDEX sessions_user ON sessions(user_id);

CREATE TABLE challenges (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  remind INTEGER NOT NULL DEFAULT 1,
  remind_time TEXT NOT NULL DEFAULT '20:00',
  insist INTEGER NOT NULL DEFAULT 1,
  created_on TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX challenges_user ON challenges(user_id);

-- Um registro por desafio por dia feito (dia no fuso do usuário, AAAA-MM-DD).
CREATE TABLE completions (
  challenge_id TEXT NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  day TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (challenge_id, day)
);
CREATE INDEX completions_user_day ON completions(user_id, day);

-- Amizade guardada nos dois sentidos.
CREATE TABLE friendships (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, friend_id)
);

CREATE TABLE push_subs (
  endpoint TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX push_subs_user ON push_subs(user_id);

-- Evita mandar o mesmo aviso duas vezes (e cutucar o mesmo amigo mais de uma vez por dia).
CREATE TABLE sent_log (
  user_id TEXT NOT NULL,
  day TEXT NOT NULL,
  slot TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, day, slot)
);

-- Chaves VAPID das notificações, geradas pelo próprio Worker na primeira vez.
CREATE TABLE config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
