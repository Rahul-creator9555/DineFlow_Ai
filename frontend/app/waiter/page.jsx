'use client';

import { useEffect, useState } from 'react';
import { socket } from '@/lib/socket';

export default function WaiterDashboard() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    socket.connect();
    socket.emit('join:room', 'staff');

    socket.on('waiter:task', (newTask) => {
      setTasks((prev) => [newTask, ...prev]);
    });

    return () => {
      socket.off('waiter:task');
      socket.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <h1 className="text-3xl font-bold text-indigo-400 mb-6">🔔 Waiter Task Panel</h1>

      <div className="space-y-4 max-w-2xl">
        {tasks.map((task, index) => (
          <div key={index} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex justify-between items-center">
            <div>
              <p className="text-lg font-bold text-slate-100">Table {task.tableNumber}</p>
              <p className="text-sm text-indigo-300">{task.requestText || 'Requested Water/Assistance'}</p>
            </div>
            <button
              onClick={() => setTasks((prev) => prev.filter((_, i) => i !== index))}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold"
            >
              Complete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}