import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, X, Play, Pause, RotateCcw, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CHUNK_SIZE = 8 * 1024 * 1024; // 8MB Default
const MAX_CONCURRENCY = 4;
const MAX_RETRIES = 3;

export default function UploadZone({ onUploadComplete }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, uploading, paused, error, complete
  const [progress, setProgress] = useState({ uploaded: 0, total: 0, percentage: 0 });
  const [speed, setSpeed] = useState(0); // bytes per sec
  const [eta, setEta] = useState(0); // seconds
  const [errorMsg, setErrorMsg] = useState(null);
  
  const uploadStateRef = useRef({
    sessionId: null,
    uploadedChunks: new Set(),
    totalChunks: 0,
    activeWorkers: 0,
    isPaused: false,
    isCancelled: false,
    startTime: 0,
    bytesUploadedSinceStart: 0,
    chunkRetries: {},
    queue: []
  });
  
  const speedIntervalRef = useRef(null);
  
  // Calculate file hash (simplified for demo to just use size/name combo, real impl would use WebCrypto API over chunks)
  const calculateFileChecksum = (f) => {
    return `${f.name}-${f.size}`;
  };

  const calculateChunkChecksum = async (chunk) => {
    // Simplified for demo - real implementation uses crypto.subtle.digest
    return "demo-checksum"; 
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (status !== 'idle' && status !== 'error') return;
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) startUploadProcess(droppedFile);
  };
  
  const handleFileSelect = (e) => {
    if (status !== 'idle' && status !== 'error') return;
    const selected = e.target.files[0];
    if (selected) startUploadProcess(selected);
  };

  const startUploadProcess = async (f) => {
    setFile(f);
    setStatus('uploading');
    setErrorMsg(null);
    setProgress({ uploaded: 0, total: f.size, percentage: 0 });
    
    const totalChunks = Math.ceil(f.size / CHUNK_SIZE);
    
    uploadStateRef.current = {
      sessionId: null,
      uploadedChunks: new Set(),
      totalChunks,
      activeWorkers: 0,
      isPaused: false,
      isCancelled: false,
      startTime: Date.now(),
      bytesUploadedSinceStart: 0,
      chunkRetries: {},
      queue: Array.from({ length: totalChunks }, (_, i) => i)
    };
    
    speedIntervalRef.current = setInterval(updateSpeedAndEta, 1000);

    try {
      const formData = new FormData();
      formData.append('filename', f.name);
      formData.append('file_size', f.size.toString());
      formData.append('total_chunks', totalChunks.toString());
      
      const res = await fetch('/api/v1/documents/upload/init', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` },
        body: formData
      });
      
      if (!res.ok) throw new Error("Failed to initialize upload");
      
      const data = await res.json();
      uploadStateRef.current.sessionId = data.upload_session_id;
      
      processQueue();
    } catch (err) {
      handleError(err.message);
    }
  };

  const updateSpeedAndEta = () => {
    const state = uploadStateRef.current;
    if (state.isPaused || status !== 'uploading') return;
    
    const elapsedSecs = (Date.now() - state.startTime) / 1000;
    if (elapsedSecs > 0) {
      const currentSpeed = state.bytesUploadedSinceStart / elapsedSecs; // bytes/sec
      setSpeed(currentSpeed);
      
      if (currentSpeed > 0 && file) {
        const remainingBytes = file.size - (state.uploadedChunks.size * CHUNK_SIZE);
        setEta(remainingBytes / currentSpeed);
      }
    }
  };

  const processQueue = useCallback(() => {
    const state = uploadStateRef.current;
    if (state.isPaused || state.isCancelled || status !== 'uploading') return;
    
    while (state.activeWorkers < MAX_CONCURRENCY && state.queue.length > 0) {
      const chunkIndex = state.queue.shift();
      uploadChunk(chunkIndex);
    }
    
    if (state.queue.length === 0 && state.activeWorkers === 0) {
      // Finished
      completeUpload();
    }
  }, [file, status]);

  const uploadChunk = async (chunkIndex) => {
    const state = uploadStateRef.current;
    if (state.isCancelled) return;
    
    state.activeWorkers++;
    
    const startByte = chunkIndex * CHUNK_SIZE;
    const endByte = Math.min(startByte + CHUNK_SIZE, file.size);
    const chunkBlob = file.slice(startByte, endByte);
    const checksum = await calculateChunkChecksum(chunkBlob);
    
    const formData = new FormData();
    formData.append('upload_session_id', state.sessionId);
    formData.append('chunk_index', chunkIndex.toString());
    formData.append('chunk_checksum', checksum);
    formData.append('file', chunkBlob, file.name);

    try {
      const res = await fetch('/api/v1/documents/upload/chunk', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` },
        body: formData
      });
      
      if (!res.ok) throw new Error(`Chunk ${chunkIndex} failed`);
      
      state.uploadedChunks.add(chunkIndex);
      state.bytesUploadedSinceStart += chunkBlob.size;
      
      setProgress(p => {
        const uploaded = state.uploadedChunks.size * CHUNK_SIZE;
        return {
          uploaded: Math.min(uploaded, p.total),
          total: p.total,
          percentage: Math.min(100, Math.round((state.uploadedChunks.size / state.totalChunks) * 100))
        };
      });
      
    } catch (err) {
      console.warn(err);
      const retries = state.chunkRetries[chunkIndex] || 0;
      if (retries < MAX_RETRIES) {
        state.chunkRetries[chunkIndex] = retries + 1;
        // Exponential backoff simulation before requeueing
        setTimeout(() => {
          if (!state.isCancelled) {
            state.queue.push(chunkIndex);
            processQueue();
          }
        }, Math.pow(2, retries) * 1000);
      } else {
        handleError(`Failed to upload chunk ${chunkIndex} after ${MAX_RETRIES} retries.`);
        return; // Don't process queue further
      }
    } finally {
      state.activeWorkers--;
      processQueue();
    }
  };

  const completeUpload = async () => {
    const state = uploadStateRef.current;
    if (state.isCancelled) return;
    
    try {
      const formData = new FormData();
      formData.append('upload_session_id', state.sessionId);
      
      const res = await fetch('/api/v1/documents/upload/complete', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` },
        body: formData
      });
      
      if (!res.ok) throw new Error("Failed to complete upload session");
      
      clearInterval(speedIntervalRef.current);
      setStatus('complete');
      setTimeout(() => {
        if (onUploadComplete) onUploadComplete();
        reset();
      }, 3000);
      
    } catch (err) {
      handleError(err.message);
    }
  };

  const handleError = (msg) => {
    clearInterval(speedIntervalRef.current);
    setStatus('error');
    setErrorMsg(msg);
    uploadStateRef.current.isPaused = true; // Stop processing
  };

  const togglePause = () => {
    const state = uploadStateRef.current;
    if (status === 'uploading') {
      state.isPaused = true;
      setStatus('paused');
      clearInterval(speedIntervalRef.current);
    } else if (status === 'paused') {
      state.isPaused = false;
      setStatus('uploading');
      state.startTime = Date.now(); // Reset speed window
      state.bytesUploadedSinceStart = 0;
      speedIntervalRef.current = setInterval(updateSpeedAndEta, 1000);
      processQueue();
    }
  };

  const cancelUpload = async () => {
    const state = uploadStateRef.current;
    state.isCancelled = true;
    state.isPaused = true;
    clearInterval(speedIntervalRef.current);
    
    if (state.sessionId) {
      const formData = new FormData();
      formData.append('upload_session_id', state.sessionId);
      fetch('/api/v1/documents/upload/cancel', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` },
        body: formData
      }).catch(console.error); // Best effort cleanup
    }
    
    reset();
  };

  const reset = () => {
    setFile(null);
    setStatus('idle');
    setProgress({ uploaded: 0, total: 0, percentage: 0 });
    setSpeed(0);
    setEta(0);
    setErrorMsg(null);
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  const formatTime = (secs) => {
    if (!secs || secs === Infinity) return '--:--';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div style={{ position: 'relative', width: '100%', marginBottom: '2rem' }}>
      
      {/* Upload Zone */}
      {status === 'idle' && (
        <label 
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
          className="glass-panel hover-card"
          style={{ 
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '4rem 2rem', border: '2px dashed var(--accent-purple)', cursor: 'pointer',
            background: 'rgba(157, 78, 221, 0.05)'
          }}
        >
          <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
            <Upload size={48} color="var(--accent-purple)" style={{ marginBottom: '1rem' }} />
          </motion.div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Drag & Drop Massive Files Here</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', textAlign: 'center' }}>
            Supports chunked, resumable uploads for enterprise files.
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid var(--border-light)' }}>Supports up to 2GB</span>
            <span className="badge" style={{ background: 'rgba(0,229,255,0.1)', color: 'var(--accent-blue)', border: '1px solid rgba(0,229,255,0.3)' }}>Parallel Uploads Active</span>
          </div>
          <input type="file" style={{ display: 'none' }} onChange={handleFileSelect} />
        </label>
      )}

      {/* Progress UI */}
      {status !== 'idle' && (
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Header */}
          <div className="flex-between">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '1rem', background: 'var(--bg-deep)', borderRadius: 'var(--radius-md)' }}>
                <FileText size={24} color={status === 'complete' ? 'var(--accent-green)' : status === 'error' ? 'var(--accent-red)' : 'var(--accent-blue)'} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{file?.name}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {formatBytes(progress.uploaded)} / {formatBytes(progress.total)}
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {(status === 'uploading' || status === 'paused') && (
                <>
                  <button className="btn-secondary" onClick={togglePause} style={{ padding: '0.5rem', borderRadius: '50%' }}>
                    {status === 'uploading' ? <Pause size={18} /> : <Play size={18} />}
                  </button>
                  <button className="btn-secondary" onClick={cancelUpload} style={{ padding: '0.5rem', borderRadius: '50%' }}>
                    <X size={18} />
                  </button>
                </>
              )}
              {status === 'error' && (
                <button className="btn-secondary" onClick={togglePause} style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <RotateCcw size={16} /> Retry Failed Chunks
                </button>
              )}
              {status === 'complete' && (
                <div style={{ color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                  <CheckCircle size={20} /> Verified & Assembled
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex-between" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
              <span style={{ color: status === 'error' ? 'var(--accent-red)' : 'var(--text-secondary)' }}>
                {status === 'uploading' && 'Streaming chunks to storage...'}
                {status === 'paused' && 'Upload paused'}
                {status === 'error' && errorMsg}
                {status === 'complete' && 'Upload complete'}
              </span>
              <span style={{ fontWeight: 'bold' }}>{progress.percentage}%</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'var(--bg-deep)', borderRadius: '4px', overflow: 'hidden' }}>
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress.percentage}%` }}
                transition={{ duration: 0.2 }}
                style={{ 
                  height: '100%', 
                  background: status === 'error' ? 'var(--accent-red)' : status === 'complete' ? 'var(--accent-green)' : 'linear-gradient(90deg, var(--accent-blue), var(--accent-purple))'
                }} 
              />
            </div>
          </div>

          {/* Telemetry Footer */}
          {(status === 'uploading' || status === 'paused') && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', background: '#050505', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Upload Speed</div>
                <div style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--accent-blue)' }}>{status === 'paused' ? '--' : formatBytes(speed) + '/s'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Time Remaining</div>
                <div style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--accent-blue)' }}>{status === 'paused' ? '--' : formatTime(eta)}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Threads</div>
                <div style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--accent-purple)' }}>{uploadStateRef.current.activeWorkers} / {MAX_CONCURRENCY}</div>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
