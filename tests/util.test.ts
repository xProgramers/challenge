import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addDays, localDay, streak, weekStart } from '../worker/util.ts';
import { insistMessage, quarter } from '../worker/reminders.ts';

test('ofensiva conta até hoje, ou até ontem se hoje ainda falta', () => {
  const d = new Set(['2026-10-25', '2026-10-26']);
  assert.equal(streak(d, '2026-10-27'), 2);
  d.add('2026-10-27');
  assert.equal(streak(d, '2026-10-27'), 3);
  assert.equal(streak(new Set(['2026-10-25']), '2026-10-27'), 0);
});

test('semana começa na segunda', () => {
  assert.equal(weekStart('2026-10-27'), '2026-10-26'); // terça
  assert.equal(weekStart('2026-11-01'), '2026-10-26'); // domingo
  assert.equal(weekStart('2026-11-02'), '2026-11-02'); // segunda
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
});

test('dia local respeita o fuso', () => {
  const at = new Date('2026-10-28T01:30:00Z');
  assert.equal(localDay('America/Sao_Paulo', at), '2026-10-27');
  assert.equal(localDay('UTC', at), '2026-10-28');
});

test('horários arredondados para o quarto de hora', () => {
  assert.equal(quarter('23:44'), '23:30');
  assert.equal(quarter('07:05'), '07:00');
});

test('avisos no tom certo', () => {
  const c = { id: 'x', name: 'Flexões', streak: 12 };
  assert.match(insistMessage('23:30', 'provocador', c, 0, 'Ana').body, /12 dias em Flexões acaba à meia-noite\. Ana já fez/);
  assert.equal(insistMessage('23:30', 'gentil', c, 0).title, 'Ainda dá tempo');
  assert.match(insistMessage('22:00', 'provocador', { ...c, streak: 0 }, 2).body, /começar.*\(e mais 2\)/);
});
