'use client'

import React, { useState } from 'react';
import axios, { AxiosError } from 'axios';
import dayjs from 'dayjs';
import { X, MessageSquare, Globe, Lock, Loader2 } from 'lucide-react';
import { Message } from '@/model/User';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { ApiResponse } from '@/types/ApiResponse';

type MessageCardProps = {
  message: Message;
  onMessageDelete: (messageId: string) => void;
};

export function MessageCard({ message, onMessageDelete }: MessageCardProps) {
  const { toast } = useToast();
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState(message.reply || '');
  const [isPublic, setIsPublic] = useState(message.isPublic || false);
  const [isSaving, setIsSaving] = useState(false);

  const handleDeleteConfirm = async () => {
    try {
      const response = await axios.delete<ApiResponse>(
        `/api/delete-message/${message._id.toString()}`
      );
      toast({
        title: response.data.message,
      });
      onMessageDelete(message._id.toString());

    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      toast({
        title: 'Error',
        description:
          axiosError.response?.data.message ?? 'Failed to delete message',
        variant: 'destructive',
      });
    } 
  };

  const handleSaveReply = async (makePublic: boolean) => {
    setIsSaving(true);
    try {
      await axios.post('/api/reply-message', {
        messageId: message._id.toString(),
        reply: replyText,
        isPublic: makePublic,
      });
      setIsPublic(makePublic);
      setIsReplying(false);
      toast({
        title: makePublic ? 'Published to Wall' : 'Reply saved privately',
      });
    } catch (error) {
       toast({
        title: 'Error',
        description: 'Failed to save reply',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card className="card-bordered hover:-translate-y-1 hover:shadow-md transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-medium leading-tight mb-2 flex-1 mr-4">{message.content}</CardTitle>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant='destructive' size="icon" className="shrink-0 w-8 h-8">
                <X className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete
                  this message.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteConfirm}>
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {dayjs(message.createdAt).format('MMM D, YYYY h:mm A')}
        </div>
      </CardHeader>
      
      {(isReplying || replyText || isPublic) && (
        <CardContent className="pt-0">
          <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-md border dark:border-slate-800 mt-2">
            <div className="flex items-center justify-between mb-2">
               <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Your Reply</span>
               {isPublic ? (
                 <span className="flex items-center text-xs text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full"><Globe className="w-3 h-3 mr-1"/> Public</span>
               ) : (
                 <span className="flex items-center text-xs text-gray-600 dark:text-gray-400 bg-gray-200 dark:bg-slate-800 px-2 py-1 rounded-full"><Lock className="w-3 h-3 mr-1"/> Private</span>
               )}
            </div>
            {isReplying ? (
               <div className="space-y-3">
                 <Textarea 
                   value={replyText}
                   onChange={(e) => setReplyText(e.target.value)}
                   placeholder="Type your reply here..."
                   className="resize-none bg-white dark:bg-slate-950"
                   rows={3}
                 />
                 <div className="flex flex-col sm:flex-row justify-end gap-2">
                   <Button size="sm" variant="outline" onClick={() => { setIsReplying(false); setReplyText(message.reply || '') }} disabled={isSaving}>
                     Cancel
                   </Button>
                   <Button size="sm" variant="secondary" onClick={() => handleSaveReply(false)} disabled={isSaving}>
                     Save Private
                   </Button>
                   <Button size="sm" onClick={() => handleSaveReply(true)} disabled={isSaving}>
                     {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-1"/> : null}
                     Publish to Wall
                   </Button>
                 </div>
               </div>
            ) : (
               <div className="text-gray-800 dark:text-gray-200 text-sm whitespace-pre-wrap">{replyText || <span className="text-gray-400 italic">No reply text yet.</span>}</div>
            )}
          </div>
        </CardContent>
      )}

      <CardFooter className="pt-0 pb-4">
        {!isReplying && (
           <Button variant="ghost" size="sm" onClick={() => setIsReplying(true)} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 -ml-2 h-8">
             <MessageSquare className="w-4 h-4 mr-2" />
             {replyText ? 'Edit Reply' : 'Add Reply'}
           </Button>
        )}
      </CardFooter>
    </Card>
  );
}
