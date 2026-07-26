'use client';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { ModeToggle } from '@/components/ModeToggle';

export default function PublicWall() {
  const params = useParams<{ username: string; projectSlug?: string }>();
  const username = params.username;
  const projectSlug = params.projectSlug;

  const [publicMessages, setPublicMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [themeColor, setThemeColor] = useState('blue');
  const [projectTitle, setProjectTitle] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        let url = `/api/get-profile?username=${username}`;
        if (projectSlug) {
          url += `&projectSlug=${projectSlug}`;
        }
        const response = await axios.get(url);
        if (response.data.success) {
           if (response.data.title) setProjectTitle(response.data.title);
           if (response.data.themeColor) setThemeColor(response.data.themeColor);
           if (response.data.publicMessages) setPublicMessages(response.data.publicMessages);
        }
      } catch (error) {
         console.error("Error fetching wall", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [username, projectSlug]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="container relative mx-auto my-8 p-6 bg-white dark:bg-slate-950 rounded-lg shadow-sm border dark:border-slate-800 max-w-4xl transition-colors">
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>
      <div className="mb-6">
         <Link href={projectSlug ? `/u/${username}/p/${projectSlug}` : `/u/${username}`} className="inline-flex items-center text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
           <ArrowLeft className="w-4 h-4 mr-1"/> Back to Board
         </Link>
      </div>
      
      {themeColor !== 'blue' && (
        <style>{`
          :root {
            --primary: ${themeColor === 'purple' ? '270 70% 50%' : themeColor === 'rose' ? '340 70% 50%' : '142 70% 40%'};
            --ring: ${themeColor === 'purple' ? '270 70% 50%' : themeColor === 'rose' ? '340 70% 50%' : '142 70% 40%'};
          }
          .dark {
            --primary: ${themeColor === 'purple' ? '270 60% 60%' : themeColor === 'rose' ? '340 60% 60%' : '142 60% 50%'};
            --ring: ${themeColor === 'purple' ? '270 60% 60%' : themeColor === 'rose' ? '340 60% 60%' : '142 60% 50%'};
          }
        `}</style>
      )}

      <h1 className="text-4xl font-bold mb-8 text-center">
        {projectTitle ? `${projectTitle} - Public Wall` : 'Public Wall'}
      </h1>

      {publicMessages.length > 0 ? (
        <div className="grid gap-6">
          {publicMessages.map((msg, index) => (
             <Card key={index} className="shadow-sm hover:shadow-md transition-shadow">
               <CardHeader className="pb-3">
                 <div className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Anonymous Asked:</div>
                 <CardTitle className="text-lg leading-snug">{msg.content}</CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-md border dark:border-slate-800">
                   <div className="text-sm font-semibold text-primary mb-2">@{username} replied:</div>
                   <div className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap text-sm">{msg.reply}</div>
                 </div>
               </CardContent>
             </Card>
          ))}
        </div>
      ) : (
         <div className="text-center p-8 text-gray-500 bg-gray-50 dark:bg-slate-900 rounded-xl border border-dashed border-gray-300 dark:border-slate-800">
           No public messages have been answered yet.
         </div>
      )}
    </div>
  );
}
