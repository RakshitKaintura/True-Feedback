import dbConnect from '@/lib/dbConnect';
import UserModel from '@/model/User';

export async function GET(request: Request) {
  await dbConnect();

  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    const projectSlug = searchParams.get('projectSlug');

    if (!username) {
      return Response.json(
        { success: false, message: 'Username is required' },
        { status: 400 }
      );
    }

    const user = await UserModel.findOne({ username });

    if (!user) {
      return Response.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    if (projectSlug) {
      const project = user.projects.find((p) => p.slug === projectSlug);
      if (!project) {
        return Response.json(
          { success: false, message: 'Project not found' },
          { status: 404 }
        );
      }

      return Response.json(
        {
          success: true,
          prompt: project.prompt,
          isAcceptingMessages: project.isAcceptingMessages,
          title: project.title,
          projectId: project._id,
        },
        { status: 200 }
      );
    } else {
      // General profile
      return Response.json(
        {
          success: true,
          prompt: user.customPrompt || '',
          isAcceptingMessages: user.isAcceptingMessages,
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('Error fetching profile:', error);
    return Response.json(
      { success: false, message: 'Error fetching profile' },
      { status: 500 }
    );
  }
}
