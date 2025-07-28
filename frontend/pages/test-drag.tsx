import { useState } from 'react';

export default function TestDrag() {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dropZone, setDropZone] = useState<string>('Drop here');

  const handleDragStart = (e: React.DragEvent, item: string) => {
    e.dataTransfer.setData('text/plain', item);
    setDraggedItem(item);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const item = e.dataTransfer.getData('text/plain');
    setDropZone(`Dropped: ${item}`);
    setDraggedItem(null);
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h1>Drag and Drop Test</h1>
      
      <div style={{ marginBottom: '2rem' }}>
        <h3>Draggable Items:</h3>
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, 'Event 1')}
          style={{
            padding: '1rem',
            backgroundColor: '#3174ad',
            color: 'white',
            borderRadius: '8px',
            margin: '0.5rem 0',
            cursor: 'grab',
            userSelect: 'none'
          }}
        >
          🎯 Event 1 (Drag me!)
        </div>
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, 'Event 2')}
          style={{
            padding: '1rem',
            backgroundColor: '#9b87a6',
            color: 'white',
            borderRadius: '8px',
            margin: '0.5rem 0',
            cursor: 'grab',
            userSelect: 'none'
          }}
        >
          🎯 Event 2 (Drag me!)
        </div>
      </div>

      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        style={{
          padding: '2rem',
          backgroundColor: '#f0f0f0',
          border: '2px dashed #ccc',
          borderRadius: '8px',
          textAlign: 'center',
          minHeight: '100px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {dropZone}
      </div>

      {draggedItem && (
        <div style={{ marginTop: '1rem', color: '#666' }}>
          Currently dragging: {draggedItem}
        </div>
      )}
    </div>
  );
} 