'use client';

import React, { useState, useRef, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Loader2, Sparkles, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CardHeader, CardContent, Card } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import * as z from 'zod';
import { ApiResponse } from '@/types/ApiResponse';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { messageSchema } from '@/schemas/messageSchema';

const specialChar = '||';
const parseStringMessages = (messageString: string): string[] => {
  return messageString.split(specialChar);
};

const initialMessageString =
  "What's your favorite movie?||Do you have any pets?||What's your dream job?";

export default function SendMessage() {
  const params = useParams<{ username: string; projectSlug?: string }>();
  const username = params.username;
  const projectSlug = params.projectSlug;

  const [suggestedMessages, setSuggestedMessages] = useState(initialMessageString);
  const [isSuggestLoading, setIsSuggestLoading] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);

  const [polishedMessage, setPolishedMessage] = useState("");
  const [isPolishLoading, setIsPolishLoading] = useState(false);
  const [polishError, setPolishError] = useState<string | null>(null);

  // Profile data
  const [customPrompt, setCustomPrompt] = useState("Send an anonymous message");
  const [isAcceptingMessages, setIsAcceptingMessages] = useState(true);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [projectTitle, setProjectTitle] = useState("");

  const form = useForm<z.infer<typeof messageSchema>>({
    resolver: zodResolver(messageSchema),
    defaultValues: { content: '' },
  });

  const messageContent = form.watch('content');

  const isCustomProject = !!projectId || customPrompt !== "Send an anonymous message";

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        let url = `/api/get-profile?username=${username}`;
        if (projectSlug) {
          url += `&projectSlug=${projectSlug}`;
        }
        const response = await axios.get(url);
        if (response.data.success) {
           setCustomPrompt(response.data.prompt || "Send an anonymous message");
           setIsAcceptingMessages(response.data.isAcceptingMessages);
           setProjectId(response.data.projectId || null);
           if (response.data.title) setProjectTitle(response.data.title);
           
           // Clear suggested messages if it's a custom project so it doesn't show default AMA questions
           if (response.data.projectId || response.data.prompt !== "Send an anonymous message") {
              setSuggestedMessages("");
           }
        }
      } catch (error) {
         toast({ title: "Error fetching profile", variant: "destructive" });
      } finally {
        setIsProfileLoading(false);
      }
    };
    fetchProfile();
  }, [username, projectSlug]);

  const handleMessageClick = (message: string) => {
    form.setValue('content', message);
  };

  const handleApplyPolished = () => {
    form.setValue('content', polishedMessage);
    setPolishedMessage(''); // clear it after applying
    toast({ title: "Feedback polished!" });
  };

  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (data: z.infer<typeof messageSchema>) => {
    setIsLoading(true);
    try {
      const payload: any = { ...data, username };
      if (projectId) payload.projectId = projectId;

      const response = await axios.post<ApiResponse>('/api/send-message', payload);

      toast({
        title: response.data.message,
        variant: 'default',
      });
      form.reset({ ...form.getValues(), content: '' });
      setPolishedMessage('');
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      toast({
        title: 'Error',
        description:
          axiosError.response?.data.message ?? 'Failed to sent message',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const TYPEWRITER_SPEED = 18;
  const fullBufferRef = useRef(''); 

  const fetchPolishedFeedback = async () => {
    if (!messageContent.trim()) return;
    setIsPolishLoading(true);
    setPolishError(null);
    setPolishedMessage('');
    fullBufferRef.current = '';

    try {
      const response = await fetch('/api/suggest-messages', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
           promptContext: customPrompt,
           mode: 'polish',
           rawMessage: messageContent
        })
      });

      if (!response.ok || !response.body) throw new Error('Failed to polish feedback');
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
      }
      if (!fullText.trim()) return;

      fullBufferRef.current = fullText;
      let charIndex = 0;
      const typeNextChar = () => {
        if (charIndex <= fullBufferRef.current.length) {
          setPolishedMessage(fullBufferRef.current.slice(0, charIndex));
          charIndex++;
          setTimeout(typeNextChar, TYPEWRITER_SPEED);
        } else {
          setIsPolishLoading(false); 
        }
      };
      typeNextChar();
    } catch (error) {
      setPolishError('Failed to polish feedback');
      setIsPolishLoading(false);
    }
  };

  const fetchSuggestedMessages = async (mode: 'suggest' | 'templates') => {
    setIsSuggestLoading(true);
    setSuggestError(null);
    setSuggestedMessages('');
    fullBufferRef.current = '';

    try {
      const response = await fetch('/api/suggest-messages', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          promptContext: customPrompt !== "Send an anonymous message" ? customPrompt : "",
          mode 
        })
      });

      if (!response.ok || !response.body) {
        throw new Error('Failed to fetch suggestions');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
      }

      if (!fullText.trim()) {
        setSuggestedMessages(mode === 'suggest' ? initialMessageString : "");
        return;
      }

      fullBufferRef.current = fullText;

      let charIndex = 0;
      const typeNextChar = () => {
        if (charIndex <= fullBufferRef.current.length) {
          setSuggestedMessages(fullBufferRef.current.slice(0, charIndex));
          charIndex++;
          setTimeout(typeNextChar, TYPEWRITER_SPEED);
        } else {
          setIsSuggestLoading(false); 
        }
      };
      typeNextChar();
      return; 
    } catch (error) {
      setSuggestError(
        error instanceof Error ? error.message : 'Failed to fetch suggestions'
      );
      setIsSuggestLoading(false);
    }
  };

  if (isProfileLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="container mx-auto my-8 p-6 bg-white rounded max-w-4xl">
      <h1 className="text-4xl font-bold mb-6 text-center">
        {projectTitle ? `Project: ${projectTitle}` : 'Public Profile'}
      </h1>
      
      {!isAcceptingMessages ? (
         <div className="text-center p-8 bg-red-50 text-red-600 rounded-lg font-medium">
           This user is not currently accepting messages on this board.
         </div>
      ) : (
      <div className="space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xl font-medium mb-4 block">
                     {customPrompt}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={`Write your anonymous message to @${username} here`}
                      className="resize-none h-32"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions Row */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {isCustomProject ? (
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button 
                    type="button" 
                    variant="secondary"
                    onClick={() => fetchSuggestedMessages('templates')}
                    disabled={isSuggestLoading}
                  >
                    {isSuggestLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Get Sentence Starters
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={fetchPolishedFeedback}
                    disabled={isPolishLoading || !messageContent?.trim()}
                  >
                    {isPolishLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                    Polish My Feedback
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  onClick={() => fetchSuggestedMessages('suggest')}
                  disabled={isSuggestLoading}
                >
                  {isSuggestLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Suggest Messages
                </Button>
              )}

              {isLoading ? (
                <Button disabled className="w-full sm:w-auto">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Please wait
                </Button>
              ) : (
                <Button type="submit" disabled={isLoading || !messageContent?.trim()} className="w-full sm:w-auto">
                  Send It
                </Button>
              )}
            </div>
          </form>
        </Form>

        {/* Polished Feedback Preview Box */}
        {polishedMessage && (
          <Card className="mt-4 border-primary/50 bg-primary/5">
            <CardHeader className="pb-3">
              <h3 className="text-sm font-medium text-primary flex items-center">
                <Wand2 className="w-4 h-4 mr-2"/>
                Polished Feedback
              </h3>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 mb-4">{polishedMessage}</p>
              <Button size="sm" onClick={handleApplyPolished}>Apply to Message</Button>
            </CardContent>
          </Card>
        )}
      </div>
      )}

      {/* Suggested Messages / Templates */}
      {isAcceptingMessages && suggestedMessages && !isCustomProject && (
      <div className="space-y-4 my-8">
        <p>Click on any message below to select it.</p>
        <Card>
          <CardHeader>
            <h3 className="text-xl font-semibold">Messages</h3>
          </CardHeader>
          <CardContent className="flex flex-col space-y-4">
            {suggestError ? (
              <p className="text-red-500">{suggestError}</p>
            ) : (
              parseStringMessages(suggestedMessages).map((message, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="mb-2 whitespace-normal h-auto text-left"
                  onClick={() => handleMessageClick(message)}
                >
                  {message}
                </Button>
              ))
            )}
          </CardContent>
        </Card>
      </div>
      )}

      {isAcceptingMessages && suggestedMessages && isCustomProject && suggestedMessages !== initialMessageString && (
      <div className="space-y-4 mt-8">
        <p className="text-sm text-gray-500">Click a template below to start your feedback.</p>
        <div className="flex flex-col space-y-3">
          {suggestError ? (
             <p className="text-red-500">{suggestError}</p>
          ) : (
             parseStringMessages(suggestedMessages).map((message, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="whitespace-normal h-auto text-left justify-start"
                  onClick={() => handleMessageClick(message)}
                >
                  {message}
                </Button>
             ))
          )}
        </div>
      </div>
      )}

      <Separator className="my-6" />
      <div className="text-center">
        <div className="mb-4">Get Your Message Board</div>
        <Link href={'/sign-up'}>
          <Button>Create Your Account</Button>
        </Link>
      </div>
    </div>
  );
}