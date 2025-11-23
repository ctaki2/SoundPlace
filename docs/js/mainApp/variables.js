// variables.js

export const pubUsername = sessionStorage.getItem("user");
export const pubPassword = sessionStorage.getItem("password");

const state = {
  songQueue: [],
  playlists: {},
  history: [],
  songIndex: -1,
  ManualQueue: 0,
  friends: {},
  shareLoc: null
};

export default state;