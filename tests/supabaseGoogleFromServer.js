const { createClient } = require('@supabase/supabase-js');
const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();

const supabaseUrl = 'https://qszrlpquzvomtegibqkl.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzenJscHF1enZvbXRlZ2licWtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzYwMTc0MDQsImV4cCI6MTk5MTU5MzQwNH0.mo8KeD8of29zrfCI4vF4QW1dkIFwKiSVWQNkO_UqMas';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const check = async () => {
  const z = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'http://localhost:3030/google',
    },
  });
  console.log(z.data);
};

app.get('/google', (req, res) => {
  const { access_token: token } = req.query;
  const z = jwt.decode(token);
  console.log(z);
  res.send('hello');
});

app.listen(3030, () => console.log(`Server running`));
