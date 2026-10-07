import { useState } from 'react';
import YourBallot from './components/YourBallot';
import AddressEntry from './components/AddressEntry';

export interface UserLocation {
  address: string;
  district: 'NC-8' | 'NC-12' | 'NC-14';
  isCharlotte: boolean;
}

export default function App() {
  const [location, setLocation] = useState<UserLocation | null>(null);

  if (!location) {
    return <AddressEntry onSubmit={setLocation} />;
  }

  return (
    <YourBallot
      location={location}
      onChangeAddress={() => setLocation(null)}
    />
  );
}
