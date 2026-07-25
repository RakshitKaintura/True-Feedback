import dbConnect from '@/lib/dbConnect';
import UserModel from '@/model/User';
import mongoose from 'mongoose';
import { User } from 'next-auth';
import { auth } from '../../../auth';

export async function GET(request: Request) {
  await dbConnect();
  const session = await auth();
  const _user: User = session?.user;

  if (!session || !_user) {
    return Response.json(
      { success: false, message: 'Not authenticated' },
      { status: 401 }
    );
  }
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  
  const userId = new mongoose.Types.ObjectId(_user._id);
  try {
    const pipeline: any[] = [
      { $match: { _id: userId } },
      { $unwind: { path: '$messages', preserveNullAndEmptyArrays: true } },
    ];

    if (projectId) {
      pipeline.push({ $match: { 'messages.projectId': new mongoose.Types.ObjectId(projectId) } });
    } else {
      pipeline.push({ $match: { 'messages.projectId': { $exists: false } } });
    }

    pipeline.push(
      { $sort: { 'messages.createdAt': -1 } },
      { $group: { _id: '$_id', messages: { $push: '$messages' } } }
    );

    const user = await UserModel.aggregate(pipeline).exec();

    if (!user || user.length === 0) {
      // If no aggregation result, it likely means no matching messages were found
      return Response.json(
        { messages: [], success: true },
        { status: 200 }
      );
    }

    // If user has no messages, messages array may contain a null entry — filter it out
    const messages = (user[0].messages || []).filter((msg: any) => msg && msg.content);

    return Response.json(
      { messages, success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error('An unexpected error occurred:', error);
    return Response.json(
      { message: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}