export interface User{
    id: string;
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    // profilePicture: string;
}

export interface TopicUser extends User{
    role: 'owner' | 'member';
}