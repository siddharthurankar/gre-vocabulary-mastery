"""GRE Vocabulary Mastery local server: localhost preview or authenticated HTTPS service.
No credentials are bundled. Runtime database is kept outside the app directory.
"""
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from pathlib import Path
import argparse,sqlite3,secrets,hashlib,hmac,json,time,ssl,os,urllib.parse,threading
parser=argparse.ArgumentParser();parser.add_argument('--host',default='127.0.0.1');parser.add_argument('--port',type=int,default=8770);parser.add_argument('--preview',action='store_true');parser.add_argument('--cert');parser.add_argument('--key');parser.add_argument('--public-origin');parser.add_argument('--database',default=str(Path.home()/'.gre-mastery-lab'/'progress.sqlite3'));args=parser.parse_args()
local=args.host in ('127.0.0.1','localhost','::1');tls=bool(args.cert and args.key)
if not local and (not tls or not args.public_origin or args.preview):parser.error('Phone access requires TLS, a trusted HTTPS public-origin, and authentication (no --preview).')
if args.public_origin and not args.public_origin.startswith('https://'):parser.error('--public-origin must use trusted HTTPS.')
store=Path(args.database).expanduser();store.parent.mkdir(parents=True,exist_ok=True);os.chmod(store.parent,0o700)
conn=sqlite3.connect(store);conn.executescript('CREATE TABLE IF NOT EXISTS users(name TEXT PRIMARY KEY,salt TEXT,hash TEXT);CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user TEXT,expires REAL);CREATE TABLE IF NOT EXISTS progress(user TEXT PRIMARY KEY,revision INTEGER NOT NULL,state TEXT);');conn.close();os.chmod(store,0o600)
root=Path(__file__).resolve().parent.parent/'web';data=json.loads((root/'data.json').read_text());known={e['canonical'] for g in data['groups'] for e in g['words']};entryids={e['id'] for g in data['groups'] for e in g['words']}
lock=threading.Lock();attempts={};scheme='https' if tls else 'http';origin=args.public_origin or f'{scheme}://{args.host}:{args.port}';allowedhosts={urllib.parse.urlparse(origin).netloc,f'127.0.0.1:{args.port}',f'localhost:{args.port}'}
def db():return sqlite3.connect(store,timeout=15)
def digest(password,salt):return hashlib.pbkdf2_hmac('sha256',password.encode(),bytes.fromhex(salt),500000).hex()
def validate_state(s):
 if not isinstance(s,dict) or s.get('version')!=1:raise ValueError('Invalid progress format.')
 for key in ['words','placements','settings']:
  if not isinstance(s.get(key),dict):raise ValueError('Invalid '+key+'.')
 if not isinstance(s.get('history'),list):raise ValueError('Invalid history.')
 if set(s['words'])-known or set(s['placements'])-entryids:raise ValueError('Unknown vocabulary in progress.')
 for p in s['words'].values():
  if not isinstance(p,dict) or not isinstance(p.get('reviewDays'),list):raise ValueError('Invalid word progress.')
  for metric in ['recognition','application']:
   m=p.get(metric,{});right=m.get('right');total=m.get('total')
   if type(right)!=int or type(total)!=int or not 0<=right<=total:raise ValueError('Invalid score.')
 if 'labSession' in s and s['labSession'] is not None:
  x=s['labSession']
  if not isinstance(x,dict) or not isinstance(x.get('questions'),list) or len(x['questions'])>200:raise ValueError('Invalid experimental session.')
 if len(s.get('journal',[]))>2000:raise ValueError('Journal is too large.')
 return s
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*a,**kw):super().__init__(*a,directory=str(root),**kw)
 def log_message(self,*a):pass
 def end_headers(self):
  self.send_header('Cache-Control','no-store');self.send_header('X-Content-Type-Options','nosniff');self.send_header('Referrer-Policy','no-referrer');self.send_header('X-Frame-Options','DENY');self.send_header('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'")
  if tls:self.send_header('Strict-Transport-Security','max-age=31536000')
  super().end_headers()
 def respond(self,status,value,cookie=None):
  body=json.dumps(value).encode();self.send_response(status);self.send_header('Content-Type','application/json');self.send_header('Content-Length',str(len(body)))
  if cookie:self.send_header('Set-Cookie',cookie)
  self.end_headers();self.wfile.write(body)
 def host_ok(self):return self.headers.get('Host') in allowedhosts
 def user(self):
  cookies=dict(x.strip().split('=',1) for x in self.headers.get('Cookie','').split(';') if '=' in x);token=cookies.get('gre_lab_session','')
  if not token:return None
  with db() as d:r=d.execute('SELECT user FROM sessions WHERE token=? AND expires>?',(hashlib.sha256(token.encode()).hexdigest(),time.time())).fetchone()
  return r[0] if r else None
 def do_GET(self):
  if not self.host_ok():return self.respond(403,{'error':'Unrecognized host.'})
  path=urllib.parse.urlsplit(self.path).path
  if path.startswith('/api/'):
   user=self.user()
   if not user:return self.respond(401,{'error':'Sign in to use private sync.'})
   if path not in ['/api/me','/api/progress']:return self.respond(404,{'error':'Not found.'})
   with db() as d:r=d.execute('SELECT revision,state FROM progress WHERE user=?',(user,)).fetchone()
   return self.respond(200,{'user':user,'revision':r[0] if r else 0,**({'state':json.loads(r[1]) if r else None} if path=='/api/progress' else {})})
  if not args.preview and path not in ['/login.html','/login.mjs','/style.css'] and not self.user():
   self.send_response(302);self.send_header('Location','/login.html');self.end_headers();return
  super().do_GET()
 def do_POST(self):self.mutate()
 def do_PUT(self):self.mutate()
 def mutate(self):
  if not self.host_ok() or self.headers.get('Origin') not in {origin,f'{scheme}://127.0.0.1:{args.port}',f'{scheme}://localhost:{args.port}'} or self.headers.get('X-GRE-Lab')!='1':return self.respond(403,{'error':'Request must come from this private app.'})
  if self.headers.get('Content-Type')!='application/json':return self.respond(415,{'error':'JSON is required.'})
  try:
   size=int(self.headers.get('Content-Length','0'))
   if not 0<size<=8_000_000:return self.respond(413,{'error':'Progress payload is too large.'})
   body=json.loads(self.rfile.read(size))
   if not isinstance(body,dict):raise ValueError()
  except:return self.respond(400,{'error':'Invalid request.'})
  path=urllib.parse.urlsplit(self.path).path
  if path in ['/api/setup','/api/login'] and self.command=='POST':
   user=body.get('user');password=body.get('password')
   if not isinstance(user,str) or not isinstance(password,str) or not 1<=len(user)<=64 or not 12<=len(password)<=256:return self.respond(400,{'error':'Use a username and a password of 12–256 characters.'})
   key=self.client_address[0];now=time.time()
   with lock:
    recent=[t for t in attempts.get(key,[]) if now-t<600];attempts[key]=recent
    if len(recent)>=5:return self.respond(429,{'error':'Too many sign-in attempts. Wait ten minutes.'})
   with db() as d:
    if path=='/api/setup':
     if self.client_address[0] not in ['127.0.0.1','::1']:return self.respond(403,{'error':'Create the first login on the laptop loopback address.'})
     salt=secrets.token_hex(16);hashed=digest(password,salt)
     try:
      d.execute('BEGIN IMMEDIATE')
      if d.execute('SELECT 1 FROM users LIMIT 1').fetchone():return self.respond(409,{'error':'Private login already exists. Sign in instead.'})
      d.execute('INSERT INTO users VALUES(?,?,?)',(user,salt,hashed));d.commit()
     except sqlite3.Error:return self.respond(409,{'error':'Private login already exists.'})
    else:
     r=d.execute('SELECT salt,hash FROM users WHERE name=?',(user,)).fetchone();salt=r[0] if r else '0'*32;check=digest(password,salt)
     if not r or not hmac.compare_digest(check,r[1]):
      with lock:attempts[key].append(now)
      return self.respond(401,{'error':'Username or password did not match.'})
    with lock:attempts[key]=[]
    token=secrets.token_urlsafe(32);d.execute('DELETE FROM sessions WHERE expires<?',(now,));d.execute('INSERT INTO sessions VALUES(?,?,?)',(hashlib.sha256(token.encode()).hexdigest(),user,now+86400));d.commit()
   cookie=f'gre_lab_session={token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400'+('; Secure' if tls else '')
   return self.respond(200,{'user':user},cookie)
  user=self.user()
  if not user:return self.respond(401,{'error':'Sign in to use private sync.'})
  if path=='/api/logout' and self.command=='POST':
   cookies=dict(x.strip().split('=',1) for x in self.headers.get('Cookie','').split(';') if '=' in x)
   with db() as d:d.execute('DELETE FROM sessions WHERE token=?',(hashlib.sha256(cookies.get('gre_lab_session','').encode()).hexdigest(),));d.commit()
   return self.respond(200,{'ok':True},'gre_lab_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0'+('; Secure' if tls else ''))
  if path=='/api/progress' and self.command=='PUT':
   try:s=validate_state(body.get('state'));rev=body.get('revision');assert type(rev)==int and rev>=0
   except:return self.respond(400,{'error':'Progress did not pass validation.'})
   with db() as d:
    d.execute('BEGIN IMMEDIATE');r=d.execute('SELECT revision FROM progress WHERE user=?',(user,)).fetchone();current=r[0] if r else 0
    if rev!=current:return self.respond(409,{'error':'Another device changed progress. Load the latest copy before saving.','revision':current})
    d.execute('INSERT INTO progress VALUES(?,?,?) ON CONFLICT(user) DO UPDATE SET revision=excluded.revision,state=excluded.state',(user,current+1,json.dumps(s)));d.commit()
   return self.respond(200,{'revision':current+1})
  return self.respond(404,{'error':'Not found.'})
server=ThreadingHTTPServer((args.host,args.port),Handler)
if tls:
 ctx=ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER);ctx.minimum_version=ssl.TLSVersion.TLSv1_2;ctx.load_cert_chain(args.cert,args.key);server.socket=ctx.wrap_socket(server.socket,server_side=True)
print(f'GRE Vocabulary Mastery: {origin}'+(' (local preview)' if args.preview else ' (authenticated)'),flush=True)
try:server.serve_forever()
except KeyboardInterrupt:server.server_close()
