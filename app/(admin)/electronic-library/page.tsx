"use client";

import React from 'react';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { LibraryItemCard } from '@/components/LibraryItemCard';

const MOCK_ITEMS: React.ComponentProps<typeof LibraryItemCard>[] = [
  {
    image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&auto=format&fit=crop&q=60',
    title: 'Advanced Physics Guide',
    center: 'Main Center, Dokki',
    price: 150,
    downloads: 342,
    status: 'Active'
  },
  {
    image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&auto=format&fit=crop&q=60',
    title: 'Advanced Physics Guide',
    center: 'Main Center, Dokki',
    price: 150,
    downloads: 342,
    status: 'Active'
  },
  {
    image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&auto=format&fit=crop&q=60',
    title: 'Advanced Physics Guide',
    center: 'Main Center, Dokki',
    price: 150,
    downloads: 342,
    status: 'Active'
  },
  {
    image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&auto=format&fit=crop&q=60',
    title: 'Advanced Physics Guide',
    center: 'Main Center, Dokki',
    price: 150,
    downloads: 342,
    status: 'Active'
  }
];

export default function ElectronicLibraryPage() {
  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Electronic Library</h1>
          <p className="text-sm text-[#64748B] mt-0.5">Manage digital books, materials, and pricing.</p>
        </div>
        <Link 
          href="/electronic-library/add"
          className="flex items-center gap-2 px-5 py-2.5 bg-[#2137D6] hover:bg-[#1a2bb3] text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-200"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </Link>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {MOCK_ITEMS.map((item, index) => (
          <LibraryItemCard key={index} {...item} />
        ))}
      </div>
    </div>
  );
}
