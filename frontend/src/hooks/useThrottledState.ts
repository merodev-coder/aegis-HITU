import { useState, useEffect, useRef, useCallback } from 'react';


export function useThrottledState(
  initialValue: string = '', 
  delayMs: number = 50,
  externalSetter?: (val: string) => void
) {
  const [value, setValue] = useState(initialValue);
  const bufferRef = useRef(initialValue);
  const lastFlushRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  
  useEffect(() => {
    if (initialValue && bufferRef.current === '') {
      bufferRef.current = initialValue;
      setValue(initialValue);
    }
  }, [initialValue]);

  
  useEffect(() => {
    lastFlushRef.current = Date.now();
  }, []);

  
  const setDirectly = useCallback((newValue: string) => {
    bufferRef.current = newValue;
    setValue(newValue);
    externalSetter?.(newValue);
  }, [externalSetter]);

  const flush = useCallback(() => {
    setValue(bufferRef.current);
    externalSetter?.(bufferRef.current);
    lastFlushRef.current = Date.now();
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, [externalSetter]);

  
  const addChunk = useCallback((chunk: string) => {
    bufferRef.current += chunk;
    const now = Date.now();
    
    if (now - lastFlushRef.current >= delayMs) {
      flush();
    } else if (!timerRef.current) {
      timerRef.current = window.setTimeout(flush, delayMs - (now - lastFlushRef.current));
    }
  }, [delayMs, flush]);

  
  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  return { value, addChunk, setDirectly, flush };
}
