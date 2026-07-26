import mongoose, { Schema, Document } from 'mongoose';

export interface Message extends Document {
  content: string;
  projectId?: mongoose.Types.ObjectId;
  createdAt: Date;
  reply?: string;
  isPublic?: boolean;
}

const MessageSchema: Schema<Message> = new mongoose.Schema({
  content: {
    type: String,
    required: true,
  },
  projectId: {
    type: Schema.Types.ObjectId,
    required: false,
  },
  reply: {
    type: String,
    required: false,
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

export interface Project extends Document {
  title: string;
  slug: string;
  prompt: string;
  isAcceptingMessages: boolean;
  themeColor?: string;
}

const ProjectSchema: Schema<Project> = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true },
  prompt: { type: String, default: "" },
  isAcceptingMessages: { type: Boolean, default: true },
  themeColor: { type: String, default: 'blue' },
});

export interface User extends Document {
  username: string;
  email: string;
  password: string;
  verifyCode: string;
  verifyCodeExpiry: Date; 
  isVerified: boolean;
  isAcceptingMessages: boolean;
  customPrompt?: string;
  projects: Project[];
  messages: Message[];
  isOAuth?: boolean;
}

// Updated User schema
const UserSchema: Schema<User> = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    trim: true,
    unique: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    match: [/.+\@.+\..+/, 'Please use a valid email address'],
  },
  password: {
    type: String,
    required: [function(this: any) { return !this.isOAuth; }, 'Password is required'],
  },
  verifyCode: {
    type: String,
    required: [function(this: any) { return !this.isOAuth; }, 'Verify Code is required'],
  },
  verifyCodeExpiry: {
    type: Date,
    required: [function(this: any) { return !this.isOAuth; }, 'Verify Code Expiry is required'],
  },
  isOAuth: {
    type: Boolean,
    default: false,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isAcceptingMessages: {
    type: Boolean,
    default: true,
  },
  customPrompt: {
    type: String,
    default: "",
  },
  projects: [ProjectSchema],
  messages: [MessageSchema],
});

const UserModel =
  (mongoose.models.User as mongoose.Model<User>) ||
  mongoose.model<User>('User', UserSchema);

export default UserModel;