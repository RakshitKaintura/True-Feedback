'use client';

import { MessageCard } from '@/components/MessageCard';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Message, Project } from '@/model/User';
import { ApiResponse } from '@/types/ApiResponse';
import { zodResolver } from '@hookform/resolvers/zod';
import axios, { AxiosError } from 'axios';
import { Loader2, RefreshCcw, Plus, Link as LinkIcon, Settings, Copy, Inbox } from 'lucide-react';
import { User } from 'next-auth';
import { useSession } from 'next-auth/react';
import React, { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { projectSchema } from '@/schemas/projectSchema';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function UserDashboard() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSwitchLoading, setIsSwitchLoading] = useState(false);
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);
  
  const [promptValue, setPromptValue] = useState("");
  const [acceptMessages, setAcceptMessages] = useState(false);
  const [themeColor, setThemeColor] = useState('blue');
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { toast } = useToast();
  const { data: session } = useSession();

  const projectForm = useForm<z.infer<typeof projectSchema>>({
    resolver: zodResolver(projectSchema),
    defaultValues: { title: '' },
  });

  const handleDeleteMessage = (messageId: string) => {
    setMessages(
      messages.filter((message) => message._id.toString() !== messageId)
    );
  };

  const fetchProjects = useCallback(async () => {
    try {
      const response = await axios.get('/api/projects');
      setProjects(response.data.projects || []);
    } catch (error) {
      console.error('Failed to fetch projects', error);
    }
  }, []);

  const fetchProfileInfo = useCallback(async () => {
    if (!session?.user) return;
    const username = (session.user as User).username;
    
    // Find selected project details
    const selectedProject = projects.find(p => String(p._id) === selectedProjectId);
    
    if (selectedProject) {
      setPromptValue(selectedProject.prompt || "");
      setAcceptMessages(selectedProject.isAcceptingMessages ?? false);
      setThemeColor(selectedProject.themeColor || "blue");
    } else {
      try {
        const response = await axios.get(`/api/get-profile?username=${username}`);
        setPromptValue(response.data.prompt || "");
        setAcceptMessages(response.data.isAcceptingMessages ?? false);
      } catch (error) {
        console.error('Failed to fetch profile settings', error);
      }
    }
  }, [session, selectedProjectId, projects]);

  const fetchMessages = useCallback(
    async (refresh: boolean = false) => {
      setIsLoading(true);
      try {
        const url = `/api/get-messages${selectedProjectId ? `?projectId=${selectedProjectId}` : ''}`;
        const response = await axios.get<ApiResponse>(url);
        setMessages(response.data.messages || []);
        if (refresh) {
          toast({
            title: 'Refreshed Messages',
            description: 'Showing latest messages',
          });
        }
      } catch (error) {
        const axiosError = error as AxiosError<ApiResponse>;
        if (axiosError.response?.status !== 404) {
           toast({
             title: 'Error',
             description: axiosError.response?.data.message ?? 'Failed to fetch messages',
             variant: 'destructive',
           });
        } else {
           setMessages([]);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [selectedProjectId, toast]
  );

  useEffect(() => {
    if (!session || !session.user) return;
    fetchProjects();
  }, [session, fetchProjects]);

  useEffect(() => {
    if (!session || !session.user) return;
    fetchProfileInfo();
    fetchMessages();
  }, [session, selectedProjectId, fetchMessages, fetchProfileInfo, projects]);

  const handleCreateProject = async (data: z.infer<typeof projectSchema>) => {
    try {
      const response = await axios.post('/api/projects', data);
      toast({ title: 'Project created successfully' });
      setProjects(response.data.projects);
      setIsDialogOpen(false);
      projectForm.reset();
    } catch (error) {
       toast({
         title: 'Error',
         description: 'Failed to create project',
         variant: 'destructive',
       });
    }
  }

  const handleUpdateSettings = async () => {
    setIsSavingPrompt(true);
    try {
      await axios.post('/api/update-project', {
        projectId: selectedProjectId,
        prompt: promptValue,
        isAcceptingMessages: acceptMessages,
        themeColor: themeColor
      });
      toast({ title: 'Settings saved successfully' });
      fetchProjects(); // Refresh projects to get new data
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update settings',
        variant: 'destructive',
      });
    } finally {
      setIsSavingPrompt(false);
    }
  };

  const handleSwitchChange = (checked: boolean) => {
    setAcceptMessages(checked);
    // Auto-save when switch changes to match previous behavior
    axios.post('/api/update-project', {
        projectId: selectedProjectId,
        prompt: promptValue,
        isAcceptingMessages: checked,
        themeColor: themeColor
    }).catch(() => {
       toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
       setAcceptMessages(!checked); // revert
    });
  };

  if (!session || !session.user) {
    return <div></div>;
  }

  const { username } = session.user as User;
  const baseUrl = `${window.location.protocol}//${window.location.host}`;
  
  const selectedProject = projects.find(p => String(p._id) === selectedProjectId);
  const profileUrl = selectedProject 
    ? `${baseUrl}/u/${username}/p/${selectedProject.slug}`
    : `${baseUrl}/u/${username}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(profileUrl);
    toast({
      title: 'URL Copied!',
      description: 'Profile URL has been copied to clipboard.',
    });
  };

  return (
    <div className="min-h-[calc(100vh-76px)] bg-slate-50 dark:bg-slate-950 w-full">
      <div className="max-w-5xl mx-auto p-4 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 mb-4 md:mb-0">
            User Dashboard
          </h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 h-9 px-4 py-2 bg-slate-900 text-slate-50 hover:bg-slate-900/90 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-50/90 shrink-0 shadow-sm transition-all hover:-translate-y-0.5">
              <Plus className="w-4 h-4 mr-1"/> New Project
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a New Feedback Project</DialogTitle>
              </DialogHeader>
              <form onSubmit={projectForm.handleSubmit(handleCreateProject)} className="space-y-4 mt-4">
                 <div>
                    <label className="text-sm font-medium mb-1 block">Project Title (e.g. Resume Feedback)</label>
                    <Input {...projectForm.register('title')} placeholder="Project Title" />
                    {projectForm.formState.errors.title && <p className="text-red-500 text-sm mt-1">{projectForm.formState.errors.title.message}</p>}
                 </div>
                 <Button type="submit" className="w-full">Create</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Modern Tab Navigation */}
        <div className="flex space-x-1 overflow-x-auto pb-2 mb-8 border-b dark:border-slate-800">
          <button 
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${selectedProjectId === null ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-t border-x dark:border-slate-800' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/50'}`}
            onClick={() => setSelectedProjectId(null)}
          >
            General Feedback
          </button>
          {projects.map(p => (
            <button 
              key={String(p._id)} 
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${selectedProjectId === String(p._id) ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-t border-x dark:border-slate-800' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/50'}`}
              onClick={() => setSelectedProjectId(String(p._id))}
            >
              {p.title}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
          <div className="md:col-span-5 space-y-6">
            <Card className="shadow-sm border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-lg"><LinkIcon className="w-5 h-5 mr-2 text-blue-500" /> Share Link</CardTitle>
                <CardDescription>Copy your unique link to receive anonymous feedback.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={profileUrl}
                      disabled
                      className="input input-bordered w-full p-2 mr-2 border rounded-md bg-slate-50 dark:bg-slate-900 dark:border-slate-700 text-sm overflow-hidden text-ellipsis whitespace-nowrap"
                    />
                    <Button onClick={copyToClipboard} size="icon" variant="secondary" className="shrink-0 shadow-sm" title="Copy Feedback Link"><Copy className="w-4 h-4"/></Button>
                  </div>
                  <Button variant="outline" className="w-full shadow-sm" onClick={() => window.open(`${profileUrl}/wall`, '_blank')}>
                     View Public Wall
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-lg"><Settings className="w-5 h-5 mr-2 text-slate-500 dark:text-slate-400" /> Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Accept Messages</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Toggle whether this board is open.</p>
                  </div>
                  <Switch
                    checked={acceptMessages}
                    onCheckedChange={handleSwitchChange}
                    disabled={isSwitchLoading}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Custom Prompt</label>
                  <Textarea 
                    placeholder="e.g. Be brutal about my resume!"
                    value={promptValue}
                    onChange={(e) => setPromptValue(e.target.value)}
                    className="resize-none text-sm bg-slate-50 dark:bg-slate-900 dark:border-slate-700"
                    rows={2}
                  />
                </div>

                {selectedProjectId && (
                  <div>
                     <label className="text-sm font-medium mb-2 block">Theme Accent</label>
                     <div className="flex gap-3">
                       {['blue', 'purple', 'rose', 'green'].map(color => (
                          <button
                            key={color}
                            onClick={() => setThemeColor(color)}
                            className={`w-8 h-8 rounded-full border-2 transition-transform ${themeColor === color ? 'border-slate-900 dark:border-slate-100 scale-110 shadow-sm' : 'border-transparent'}`}
                            style={{ backgroundColor: color === 'blue' ? '#3b82f6' : color === 'purple' ? '#a855f7' : color === 'rose' ? '#f43f5e' : '#22c55e' }}
                            title={color.charAt(0).toUpperCase() + color.slice(1)}
                          />
                       ))}
                     </div>
                  </div>
                )}
                
                <Button 
                  onClick={handleUpdateSettings} 
                  disabled={isSavingPrompt} 
                  className="w-full text-white border-0"
                  style={{ backgroundColor: themeColor === 'blue' ? '#3b82f6' : themeColor === 'purple' ? '#a855f7' : themeColor === 'rose' ? '#f43f5e' : '#22c55e' }}
                >
                  {isSavingPrompt ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Save Settings
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-7">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center"><Inbox className="w-5 h-5 mr-2 text-slate-700 dark:text-slate-300"/> Feedback</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  fetchMessages(true);
                }}
                className="shadow-sm"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCcw className="h-4 w-4 mr-2" />
                )}
                Refresh
              </Button>
            </div>
            
            {messages.length > 0 ? (
              <div className="space-y-4">
                {messages.map((message) => (
                  <MessageCard
                    key={message._id.toString()}
                    message={message}
                    onMessageDelete={handleDeleteMessage}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50">
                 <Inbox className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                 <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">No feedback yet</h3>
                 <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Share your link to start receiving anonymous messages.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserDashboard;