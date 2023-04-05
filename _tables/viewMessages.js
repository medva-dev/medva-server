const name = require('path').basename(__filename).split('.')[0];

module.exports = async (transaction) =>
  transaction.raw(`CREATE OR REPLACE VIEW "${name}" as
  select distinct("clientId") as "clientId",
  (select "updatedAt" from messages as m2 WHERE m2."clientId" = m1."clientId" ORDER BY m2."updatedAt" DESC LIMIT 1) as "latestUpdate",
  (select "message" from messages as m3 WHERE m3."clientId" = m1."clientId" ORDER BY m3."updatedAt" DESC LIMIT 1) as "latestMessage",
  (select count(id) from messages as m4 WHERE m4."clientId" = m1."clientId" AND "seenAt" IS NULL AND "userId" IS NULL) as "unreadCount",
  (select count(id) from messages as m5 WHERE m5."clientId" = m1."clientId" AND "seenAt" IS NULL AND "userId" IS NOT NULL) as "clientUnreadCount",
  c.name as "clientName",
  c."avatarUrl" as "avatarUrl"
  from "messages" as m1 
  JOIN "clients" as c ON c."id" = m1."clientId"
  ORDER BY "latestUpdate" DESC;

  `);
