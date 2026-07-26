'use client'

import React from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Button } from './ui/button';
import { User } from 'next-auth';
import { ModeToggle } from './ModeToggle';

function Navbar() {
  const { data: session } = useSession();
  const user : User = session?.user;

  return (
    <nav className="p-4 md:p-6 shadow-md bg-gray-900 text-white dark:bg-slate-950">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
        <a href="#" className="text-xl font-bold mb-4 md:mb-0">
          True Feedback
        </a>
        <div className="flex items-center gap-4">
          <ModeToggle />
          {session ? (
            <>
              <span className="mr-4 hidden md:inline">
                Welcome, {user.username || user.email}
              </span>
              <Button onClick={() => signOut()} className="w-full md:w-auto bg-slate-100 text-black dark:bg-slate-800 dark:text-white" variant='outline'>
                Logout
              </Button>
            </>
          ) : (
            <Link href="/sign-in">
              <Button className="w-full md:w-auto bg-slate-100 text-black dark:bg-slate-800 dark:text-white" variant={'outline'}>Login</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
