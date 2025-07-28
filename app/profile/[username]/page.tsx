import { notFound } from 'next/navigation'
import ProfileContent from './ProfileContent'

async function getUser(username: string) {
  const url = `${process.env.NEXTAUTH_URL}/api/users?username=${username}`;
  console.log('Fetching user data from:', url);
  
  const res = await fetch(url, { next: { revalidate: 3600 } })
  
  if (!res.ok) {
    if (res.status === 404) return null
    throw new Error(`Failed to fetch user: ${res.status} ${res.statusText}`)
  }
  
  const rawResponse = await res.text();
  console.log('Raw API response:', rawResponse);

  try {
    const userData = JSON.parse(rawResponse);
    console.log('Parsed user data:', JSON.stringify(userData, null, 2));
    return userData;
  } catch (error) {
    console.error('Error parsing user data:', error);
    throw new Error('Failed to parse user data');
  }
}

export default async function ProfilePage(props: { params: Promise<{ username: string }> }) {
  const params = await props.params;
  try {
    const user = await getUser(params.username)

    if (!user) {
      console.log('User not found');
      notFound()
    }

    console.log('User data in ProfilePage:', JSON.stringify(user, null, 2));
    console.log('Posts in ProfilePage:', user.posts);

    return <ProfileContent user={user} />
  } catch (error) {
    console.error('Error in ProfilePage:', error);
    throw error; // This will trigger the closest error boundary
  }
}