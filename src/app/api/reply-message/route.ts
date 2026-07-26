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
    const { messageId, reply, isPublic } = await request.json();

    if (!messageId) {
      return Response.json(
        { success: false, message: 'Message ID is required' },
        { status: 400 }
      );
    }

    const updatedUser = await UserModel.findOneAndUpdate(
      { _id: user._id, 'messages._id': messageId },
      {
        $set: {
          'messages.$.reply': reply || "",
          'messages.$.isPublic': isPublic || false,
        },
      },
      { new: true }
    );

    if (!updatedUser) {
      return Response.json(
        { message: 'Message not found or already deleted', success: false },
        { status: 404 }
      );
    }

    return Response.json(
      { message: 'Message reply updated successfully', success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error replying to message:', error);
    return Response.json(
      { message: 'Error replying to message', success: false },
      { status: 500 }
    );
  }
}
