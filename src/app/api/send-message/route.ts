import UserModel from '@/model/User';
import dbConnect from '@/lib/dbConnect';
import { Message } from '@/model/User';

export async function POST(request: Request) {
  await dbConnect();
  const { username, content, projectId } = await request.json();

  try {
    const user = await UserModel.findOne({ username }).exec();

    if (!user) {
      return Response.json(
        { message: 'User not found', success: false },
        { status: 404 }
      );
    }

    if (projectId) {
      // Find the project to check if it's accepting messages
      const project = user.projects.find(p => p._id.toString() === projectId);
      if (!project) {
        return Response.json(
          { message: 'Project not found', success: false },
          { status: 404 }
        );
      }
      if (!project.isAcceptingMessages) {
        return Response.json(
          { message: 'Project is not accepting messages', success: false },
          { status: 403 }
        );
      }
    } else {
      // Check if the general user is accepting messages
      if (!user.isAcceptingMessages) {
        return Response.json(
          { message: 'User is not accepting messages', success: false },
          { status: 403 }
        );
      }
    }

    const newMessage: any = { content, createdAt: new Date() };
    if (projectId) {
      newMessage.projectId = projectId;
    }

    // Push the new message to the user's messages array
    user.messages.push(newMessage as Message);
    await user.save();

    return Response.json(
      { message: 'Message sent successfully', success: true },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding message:', error);
    return Response.json(
      { message: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}