// variables.js

export const pubUsername = sessionStorage.getItem("user");
export const pubPassword = sessionStorage.getItem("password");

const state = {
  songQueue: [],
  playlists: {},
  songIndex: -1,
  history: [],
  ManualQueue: 0
};

export default state;