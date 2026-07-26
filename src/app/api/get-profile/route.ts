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

      const publicMessages = user.messages
        .filter((m) => m.isPublic && m.projectId?.toString() === project._id.toString())
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return Response.json(
        {
          success: true,
          prompt: project.prompt,
          isAcceptingMessages: project.isAcceptingMessages,
          title: project.title,
          projectId: project._id,
          themeColor: project.themeColor || 'blue',
          publicMessages,
        },
        { status: 200 }
      );
    } else {
      // General profile
      const publicMessages = user.messages
        .filter((m) => m.isPublic && !m.projectId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return Response.json(
        {
          success: true,
          prompt: user.customPrompt || '',
          isAcceptingMessages: user.isAcceptingMessages,
          publicMessages,
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
