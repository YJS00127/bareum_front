import {
  createContext,
  useState,
  useEffect,
} from "react";

export const UserContext =
  createContext();

export const UserProvider = ({
  children,
}) => {
  const [currentUser, setCurrentUser] =
    useState(null);

  useEffect(() => {
    const savedUser =
      localStorage.getItem(
        "current_user"
      );

    if (savedUser) {
      setCurrentUser(
        JSON.parse(savedUser)
      );
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "current_user",
      JSON.stringify(currentUser)
    );
  }, [currentUser]);

  return (
    <UserContext.Provider
      value={{
        currentUser,
        setCurrentUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};