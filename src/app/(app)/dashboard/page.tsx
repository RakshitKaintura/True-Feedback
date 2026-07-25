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
import { Loader2, RefreshCcw, Plus } from 'lucide-react';
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

function UserDashboard() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSwitchLoading, setIsSwitchLoading] = useState(false);
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);
  
  // Custom prompt state
  const [promptValue, setPromptValue] = useState("");
  const [acceptMessages, setAcceptMessages] = useState(false);
  
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
        isAcceptingMessages: acceptMessages
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
        isAcceptingMessages: checked
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
    <div className="my-8 mx-4 md:mx-8 lg:mx-auto p-6 bg-white rounded w-full max-w-6xl">
      <h1 className="text-4xl font-bold mb-6">User Dashboard</h1>

      {/* Boards / Projects Navigation */}
      <div className="flex space-x-2 overflow-x-auto pb-4 mb-4 border-b">
        <Button 
          variant={selectedProjectId === null ? 'default' : 'outline'} 
          onClick={() => setSelectedProjectId(null)}
        >
          General Feedback
        </Button>
        {projects.map(p => (
          <Button 
            key={String(p._id)} 
            variant={selectedProjectId === String(p._id) ? 'default' : 'outline'} 
            onClick={() => setSelectedProjectId(String(p._id))}
          >
            {p.title}
          </Button>
        ))}
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2">
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
               <Button type="submit">Create</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Copy Your Unique Link</h2>
        <div className="flex items-center">
          <input
            type="text"
            value={profileUrl}
            disabled
            className="input input-bordered w-full p-2 mr-2 border rounded bg-gray-50"
          />
          <Button onClick={copyToClipboard}>Copy</Button>
        </div>
      </div>

      <div className="mb-4 flex items-center">
        <Switch
          checked={acceptMessages}
          onCheckedChange={handleSwitchChange}
          disabled={isSwitchLoading}
        />
        <span className="ml-2">
          Accept Messages: {acceptMessages ? 'On' : 'Off'}
        </span>
      </div>

      <div className="mb-6">
         <h2 className="text-lg font-semibold mb-2">Custom Prompt</h2>
         <div className="flex flex-col md:flex-row gap-2">
           <Textarea 
             placeholder="e.g. Be brutal about my resume!"
             value={promptValue}
             onChange={(e) => setPromptValue(e.target.value)}
             className="resize-none md:w-2/3"
             rows={1}
           />
           <Button onClick={handleUpdateSettings} disabled={isSavingPrompt} className="w-full md:w-auto">
             {isSavingPrompt ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
             Save Settings
           </Button>
         </div>
      </div>

      <Separator />

      <Button
        className="mt-4"
        variant="outline"
        onClick={(e) => {
          e.preventDefault();
          fetchMessages(true);
        }}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCcw className="h-4 w-4" />
        )}
      </Button>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
        {messages.length > 0 ? (
          messages.map((message, index) => (
            <MessageCard
              key={message._id.toString()}
              message={message}
              onMessageDelete={handleDeleteMessage}
            />
          ))
        ) : (
          <p>No messages to display.</p>
        )}
      </div>
    </div>
  );
}

export default UserDashboard;