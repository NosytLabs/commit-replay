'use client';
import {useEffect,useState} from 'react';
let cached:Promise<string>|undefined;
export function useMascot(){const [image,setImage]=useState('');useEffect(()=>{let active=true;cached??=fetch('/assets/commit-cat.png',{cache:'force-cache'}).then(r=>{if(!r.ok)throw new Error('Asset unavailable');return r.blob();}).then(blob=>new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=reject;reader.readAsDataURL(blob);})).catch(()=>{cached=undefined;return '';});void cached.then(data=>{if(active)setImage(data);});return()=>{active=false;};},[]);return image;}
