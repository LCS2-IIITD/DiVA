import functools
import os

import flask

from authlib.integrations.requests_client import OAuth2Session
import google.oauth2.credentials
import googleapiclient.discovery
from dotenv import load_dotenv

load_dotenv()

ACCESS_TOKEN_URI = 'https://www.googleapis.com/oauth2/v4/token'
AUTHORIZATION_URL = 'https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&prompt=consent'

AUTHORIZATION_SCOPE ='openid email profile'

AUTH_REDIRECT_URI = 'http://localhost:5000/google/auth'
BASE_URI = 'http://localhost:5000'
CLIENT_ID = os.getenv('CLIENT_ID')
CLIENT_SECRET = os.getenv('CLIENT_SECRET')

AUTH_TOKEN_KEY = 'auth_token'
AUTH_STATE_KEY = 'auth_state'

app = flask.Blueprint('google_auth', __name__)

def is_logged_in():
    print("Is Logged in", AUTH_TOKEN_KEY in flask.session)
    return True if AUTH_TOKEN_KEY in flask.session else False

def build_credentials():
    if not is_logged_in():
        raise Exception('User must be logged in')

    oauth2_tokens = flask.session[AUTH_TOKEN_KEY]
    
    return google.oauth2.credentials.Credentials(
                oauth2_tokens['access_token'],
                refresh_token=oauth2_tokens['refresh_token'],
                client_id=CLIENT_ID,
                client_secret=CLIENT_SECRET,
                token_uri=ACCESS_TOKEN_URI)

def get_user_info():
    credentials = build_credentials()

    oauth2_client = googleapiclient.discovery.build(
                        'oauth2', 'v2',
                        credentials=credentials)

    return oauth2_client.userinfo().get().execute()

def no_cache(view):
    @functools.wraps(view)
    def no_cache_impl(*args, **kwargs):
        response = flask.make_response(view(*args, **kwargs))
        response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '-1'
        return response

    return functools.update_wrapper(no_cache_impl, view)

@app.route('/google/login')
@no_cache
def login():
    print("HERE!")
    session = OAuth2Session(CLIENT_ID, CLIENT_SECRET,
                            scope=AUTHORIZATION_SCOPE,
                            redirect_uri=AUTH_REDIRECT_URI)
    print("HERE2!")
    uri, state = session.create_authorization_url(AUTHORIZATION_URL)
    # print(uri, state)
    flask.session[AUTH_STATE_KEY] = state
    flask.session.permanent = True
    # print(flask.session)
    return flask.redirect(uri, code=302)

@app.route('/google/auth')
@no_cache
def google_auth_redirect():
    # print(flask.session)
    req_state = flask.request.args.get('state', default=None, type=None)
    # print(req_state, flask.session.get(AUTH_STATE_KEY, None))
    if req_state != flask.session.get(AUTH_STATE_KEY, None):
        response = flask.make_response('Invalid state parameter', 401)
        return response
    
    session = OAuth2Session(CLIENT_ID, CLIENT_SECRET,
                            scope=AUTHORIZATION_SCOPE,
                            state=flask.session[AUTH_STATE_KEY],
                            redirect_uri=AUTH_REDIRECT_URI)

    oauth2_tokens = session.fetch_access_token(
                        ACCESS_TOKEN_URI,            
                        authorization_response=flask.request.url)

    flask.session[AUTH_TOKEN_KEY] = oauth2_tokens

    return flask.redirect(BASE_URI, code=302)

@app.route('/google/logout')
@no_cache
def logout():
    flask.session.pop(AUTH_TOKEN_KEY, None)
    flask.session.pop(AUTH_STATE_KEY, None)

    return flask.redirect(BASE_URI, code=302)
