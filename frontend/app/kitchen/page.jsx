'use client';

import { useEffect, useState } from 'react';
import { socket } from '@/lib/socket';

export default function KitchenDashboard() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    socket.connect();
    socket.emit('join:room', 'kitchen');

    // Fetch initial orders
    fetch('http://localhost:5000/api/orders/pending')
      .then((res) => res.json())
      .then((data) => setOrders(data))
      .catch((err) => console.log(err));

    // Listen for new orders live!
    socket.on('order:new', (newOrder) => {
      setOrders((prev) => [newOrder, ...prev]);
    });

    return () => {
      socket.off('order:new');
      socket.disconnect();
    };
  }, []);

  const updateOrderStatus = async (orderId, newStatus) => {
    await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });

    setOrders((prev) =>
      prev.map((o) => (o._id === orderId ? { ...o, overallStatus: newStatus } : o))
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <header className="flex justify-between items-center mb-8 border-b border-slate-700 pb-4">
        <h1 className="text-3xl font-bold text-amber-400">👨‍🍳 Kitchen Display System (KDS)</h1>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-sm text-slate-300">Live Socket Connected</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {orders.map((order) => (
          <div
            key={order._id}
            className="bg-slate-800 rounded-xl p-5 border border-slate-700 shadow-lg flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xl font-bold text-amber-300">Table {order.tableNumber}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  order.source.includes('voice') ? 'bg-purple-900 text-purple-300' : 'bg-blue-900 text-blue-300'
                }`}>
                  {order.source.includes('voice') ? '🎙️ Voice Note' : '💬 Text'}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm bg-slate-900/50 p-2 rounded border border-slate-800">
                    <div>
                      <span className="font-semibold text-white">{item.name}</span>
                      {item.customization && (
                        <p className="text-xs text-amber-400 italic">Note: {item.customization}</p>
                      )}
                    </div>
                    <span className="font-bold text-slate-300">x{item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-700 flex gap-2">
              <button
                onClick={() => updateOrderStatus(order._id, 'preparing')}
                className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-medium py-2 rounded-lg transition"
              >
                Preparing
              </button>
              <button
                onClick={() => updateOrderStatus(order._id, 'ready')}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 rounded-lg transition"
              >
                Ready
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}