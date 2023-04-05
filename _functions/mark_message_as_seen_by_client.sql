CREATE OR REPLACE FUNCTION {name}("clientId" text) RETURNS jsonb AS
$$
  if(!clientId || String(clientId).trim() === ''){
		throw new Error('No clientId provided');
	}

  plv8.execute(`UPDATE messages SET "seenAt" = NOW() WHERE "clientId"=$1 AND "seenAt" IS NULL AND "userId" IS NOT NULL`,[clientId]);

	return { success: true };
$$
LANGUAGE plv8;