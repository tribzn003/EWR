import React, {useEffect, useState} from 'react';
import MoveUpPurchase from './MoveUpPurchase';
import {
  SafeAreaView, View, Text, TextInput,
  Pressable, FlatList, StyleSheet
} from 'react-native';

type Screen='login'|'register'|'home'|'ranking'|'profile'|'moveup';
type User={nickname:string;rank:number;credits:number};
type Row={rank:number;nickname:string};

const API='https://ewr.onrender.com/api/v1';

async function api(path:string, init:RequestInit={}, token?:string){
  const r=await fetch(API+path,{
    ...init,
    headers:{
      'Content-Type':'application/json',
      ...(token?{Authorization:`Bearer ${token}`}:{})
    }
  });
  if(!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

export default function App(){
  const [screen,setScreen]=useState<Screen>('login');
  const [token,setToken]=useState('');
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [nickname,setNickname]=useState('');
  const [user,setUser]=useState<User|null>(null);
  const [ranking,setRanking]=useState<Row[]>([]);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');

  const load=async()=>{
    if(!token)return;
    try{
      const [u,r]=await Promise.all([
        api('/me',{},token),
        api('/ranking',{},token)
      ]);
      setUser({
        nickname:u.nickname,
        rank:u.rank,
        credits:u.credits
      });
      setRanking(r);
    }catch(e){
      setError('Could not load account');
    }
  };

  useEffect(()=>{if(token)load()},[token]);

  const login=async()=>{
    try{
      setBusy(true);
      setError('');
      const x=await api('/login',{
        method:'POST',
        body:JSON.stringify({email,password})
      });
      setToken(x.access_token);
      setScreen('home');
    }catch(e){
      setError('Login failed');
    }finally{
      setBusy(false);
    }
  };

  const register=async()=>{
    if(!nickname.trim() || !email.trim() || !password){
      setError('Complete all fields');
      return;
    }

    try{
      setBusy(true);
      setError('');

      await api('/register',{
        method:'POST',
        body:JSON.stringify({
          nickname:nickname.trim(),
          email:email.trim().toLowerCase(),
          password
        })
      });

      const x=await api('/login',{
        method:'POST',
        body:JSON.stringify({
          email:email.trim().toLowerCase(),
          password
        })
      });

      setToken(x.access_token);
      setScreen('home');
    }catch(e){
      setError('Registration failed');
    }finally{
      setBusy(false);
    }
  };

  if(!token){
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>

          <Text style={s.logo}>🌍 EARTH</Text>
          <Text style={s.title}>WORLD RANKING</Text>
          <Text style={s.tag}>ONE WORLD. ONE RANKING.</Text>

          {screen==='register' && (
            <TextInput
              style={s.input}
              placeholder="Nickname"
              value={nickname}
              onChangeText={setNickname}
            />
          )}

          <TextInput
            style={s.input}
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            style={s.input}
            placeholder="Password"
            secureTextEntry
