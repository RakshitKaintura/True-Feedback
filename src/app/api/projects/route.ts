import { auth } from '../../../auth';
import dbConnect from '@/lib/dbConnect';
import UserModel from '@/model/User';
import mongoose from 'mongoose';

export async function GET(request: Request) {
  await dbConnect();
  const session = await auth();
  const user = session?.user;

  if (!session || !user) {
    return Response.json(
      { success: false, message: 'Not authenticated' },
      { status: 401 }
    );
  }

  try {
    const foundUser = await UserModel.findById(user._id);

    if (!foundUser) {
      return Response.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return Response.json(
      {
        success: true,
        projects: foundUser.projects || [],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error retrieving projects:', error);
    return Response.json(
      { success: false, message: 'Error retrieving projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  await dbConnect();
  const session = await auth();
  const user = session?.user;

  if (!session || !user) {
    return Response.json(
      { success: false, message: 'Not authenticated' },
      { status: 401 }
    );
  }

  try {
    const { title, prompt, themeColor } = await request.json();

    if (!title) {
      return Response.json(
        { success: false, message: 'Project title is required' },
        { status: 400 }
      );
    }

    // Basic slugification
    let slug = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    // Make slug unique by appending random chars
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    slug = `${slug}-${randomSuffix}`;

    const newProject = {
      title,
      slug,
      prompt: prompt || "",
      isAcceptingMessages: true,
      themeColor: themeColor || 'blue',
    };

    const updatedUser = await UserModel.findByIdAndUpdate(
      user._id,
      { $push: { projects: newProject } },
      { new: true }
    );

    if (!updatedUser) {
      return Response.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return Response.json(
      { success: true, message: 'Project created successfully', projects: updatedUser.projects },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating project:', error);
    return Response.json(
      { success: false, message: 'Error creating project' },
      { status: 500 }
    );
  }
}
