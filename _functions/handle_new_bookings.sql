CREATE OR REPLACE FUNCTION {name}() RETURNS trigger AS
$$
  const va = plv8.execute(`SELECT id, status FROM "virtualAssistants" WHERE id=$1`,[NEW.virtualAssistantId])[0];
	
	if(!va || !va.id){
		throw new Error(`Virtual Assistant not found`);
	}

  if(va.status !== 'open'){
    throw new Error(`Virtual Assistant is not available`)
  }

  const client = plv8.execute(`SELECT id, timezone FROM "clients" WHERE id=$1`,[NEW.clientId])[0];
  
  if(!client){
    throw new Error(`Client not found`);
  }

  if(!client.timezone){
    throw new Error(`Please update your timezone first`);
  }

  NEW.timezone = client.timezone;
  NEW.status = 'active';

	plv8.execute(`UPDATE "virtualAssistants" SET status='booked' WHERE id=$1`,[NEW.virtualAssistantId]);

	return NEW;
$$
LANGUAGE plv8;