import { createContext, useState, useEffect } from "react";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  // ✨ [수정] 컴포넌트가 처음 켜질 때(새로고침 포함) localStorage에서 먼저 데이터를 꺼내서 초기값으로 지정합니다.
  // 이렇게 하면 처음에 null이 들어가지 않아서 덮어쓰기 버그가 안 생깁니다.
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem("current_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // ✨ [수정] currentUser 상태가 바뀔 때마다 창고(localStorage)를 동기화합니다.
  useEffect(() => {
    if (currentUser) {
      // 유저 정보가 존재하면 창고에 이쁘게 저장하고,
      localStorage.setItem("current_user", JSON.stringify(currentUser));
    } else {
      // 로그아웃 등으로 currentUser가 null이 되면 창고를 깨끗하게 비웁니다.
      localStorage.removeItem("current_user");
    }
  }, [currentUser]);

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser }}>
      {children}
    </UserContext.Provider>
  );
};