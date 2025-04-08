import React, { useState } from 'react';
import { auth } from './firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const ProfileAuth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isNewUser, setIsNewUser] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (isNewUser) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate('/checkin');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#111827] text-white flex items-center justify-center">
      <form onSubmit={handleAuth} className="bg-[#1F2937] p-8 rounded shadow max-w-sm w-full space-y-6">
        <h2 className="text-2xl font-bold text-center">
          {isNewUser ? 'Create your Seek profile' : 'Log in to Seek'}
        </h2>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          className="w-full p-2 rounded bg-white text-black"
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          className="w-full p-2 rounded bg-white text-black"
        />

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 py-2 rounded">
          {isNewUser ? 'Sign Up' : 'Log In'}
        </button>

        <p className="text-sm text-center">
          {isNewUser ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button type="button" className="underline" onClick={() => setIsNewUser(!isNewUser)}>
            {isNewUser ? 'Log In' : 'Sign Up'}
          </button>
        </p>
      </form>
    </div>
  );
};

export default ProfileAuth;
