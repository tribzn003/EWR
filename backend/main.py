from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import sqlite3
import hashlib
import secrets

app = FastAPI(title="EWR API")

DB = "ewr.db"
tokens = {}

def db():
    con = sqlite3.connect(DB)
    con.row_factory = sqlite3.Row
    con.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nickname TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            credits INTEGER DEFAULT 0
        )
    """)
    con.commit()
    return con

def password_hash(password):
    return hashlib.sha256(password.encode()).hexdigest()

class Register(BaseModel):
    nickname: str
    email: str
    password: str

class Login(BaseModel):
    email: str
    password: str

@app.get("/")
def root():
    return {"status": "EWR API online"}

@app.post("/api/v1/register")
def register(data: Register):
    con = db()
    try:
        cur = con.execute(
            "INSERT INTO users(nickname,email,password_hash) VALUES(?,?,?)",
            (data.nickname, data.email, password_hash(data.password))
        )
        con.commit()
        return {"id": cur.lastrowid, "nickname": data.nickname}
    except sqlite3.IntegrityError:
        raise HTTPException(409, "Nickname or email already exists")
    finally:
        con.close()

@app.post("/api/v1/login")
def login(data: Login):
    con = db()
    user = con.execute(
        "SELECT * FROM users WHERE email=? AND password_hash=?",
        (data.email, password_hash(data.password))
    ).fetchone()
    con.close()

    if not user:
        raise HTTPException(401, "Invalid login")

    token = secrets.token_urlsafe(32)
    tokens[token] = user["id"]

    return {"access_token": token}

@app.get("/api/v1/ranking")
def ranking():
    con = db()
    users = con.execute(
        "SELECT nickname,credits FROM users ORDER BY credits DESC,id ASC"
    ).fetchall()
    con.close()

    return [
        {"rank": i + 1, "nickname": u["nickname"]}
        for i, u in enumerate(users)
  ]
