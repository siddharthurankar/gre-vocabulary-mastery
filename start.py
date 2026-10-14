"""Start GRE Vocabulary Mastery locally; no dependencies beyond Python 3."""
import runpy,sys,threading,webbrowser
from pathlib import Path
open_browser='--no-browser' not in sys.argv
script=Path(__file__).parent/'tools'/'serve.py'
sys.argv=[str(script),'--preview','--port','8770']
if open_browser:threading.Timer(.5,lambda:webbrowser.open('http://127.0.0.1:8770')).start()
runpy.run_path(str(script),run_name='__main__')
