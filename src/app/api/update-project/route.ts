import dbConnect from '@/lib/dbConnect';
import UserModel from '@/model/User';
import { auth } from '../../../auth';

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
    const { projectId, prompt, isAcceptingMessages } = await request.json();
    
    if (projectId) {
      // Update specific project
      const updatedUser = await UserModel.findOneAndUpdate(
        { _id: user._id, 'projects._id': projectId },
        { 
          $set: { 
            'projects.$.prompt': prompt,
            'projects.$.isAcceptingMessages': isAcceptingMessages
          } 
        },
        { new: true }
      );

      if (!updatedUser) {
        return Response.json({ success: false, message: 'Project not found' }, { status: 404 });
      }

      return Response.json({ success: true, message: 'Project updated successfully' }, { status: 200 });
    } else {
      // Update general profile
      const updatedUser = await UserModel.findByIdAndUpdate(
        user._id,
        { 
          $set: { 
            customPrompt: prompt,
            isAcceptingMessages: isAcceptingMessages
          } 
        },
        { new: true }
      );

      if (!updatedUser) {
        return Response.json({ success: false, message: 'User not found' }, { status: 404 });
      }

      return Response.json({ success: true, message: 'Profile updated successfully' }, { status: 200 });
    }

  } catch (error) {
    console.error('Error updating project:', error);
    return Response.json(
      { success: false, message: 'Error updating project' },
      { status: 500 }
    );
  }
}
