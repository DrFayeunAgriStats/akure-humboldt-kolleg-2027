'use client';
import {createContext,useCallback,useContext,useEffect,useRef,useState,type ReactNode} from 'react';

export type ToastKind = 'success' | 'error' | 'info';
type Toast = {id:number;message:string;kind:ToastKind};
type Notify = (message:string,kind?:ToastKind)=>void;
const ToastContext=createContext<Notify|null>(null);

export function ToastProvider({children}:{children:ReactNode}){
  const [messages,setMessages]=useState<Toast[]>([]);
  const nextId=useRef(0);
  const timers=useRef(new Map<number,ReturnType<typeof setTimeout>>());

  const dismiss=useCallback((id:number)=>{
    const timer=timers.current.get(id);
    if(timer)clearTimeout(timer);
    timers.current.delete(id);
    setMessages(current=>current.filter(item=>item.id!==id));
  },[]);

  const notify=useCallback<Notify>((message,kind='info')=>{
    const id=++nextId.current;
    setMessages(current=>[...current.slice(-2),{id,message,kind}]);
    timers.current.set(id,setTimeout(()=>dismiss(id),kind==='error'?8000:5500));
  },[dismiss]);

  useEffect(()=>()=>{
    for(const timer of timers.current.values())clearTimeout(timer);
    timers.current.clear();
  },[]);

  return <ToastContext.Provider value={notify}>
    {children}
    <aside className="app-toast-stack" aria-label="Notifications">
      {messages.map(item=><div className={'app-toast app-toast-'+item.kind} role={item.kind==='error'?'alert':'status'} key={item.id}>
        <span className="app-toast-icon" aria-hidden="true">{item.kind==='success'?'✓':item.kind==='error'?'!':'i'}</span>
        <span className="app-toast-message">{item.message}</span>
        <button className="app-toast-close" type="button" aria-label="Dismiss notification" onClick={()=>dismiss(item.id)}>×</button>
      </div>)}
    </aside>
  </ToastContext.Provider>;
}

export function useToast(){
  const notify=useContext(ToastContext);
  if(!notify)throw new Error('useToast must be used inside ToastProvider');
  return notify;
}
