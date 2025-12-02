// variables.js

export const pubUsername = sessionStorage.getItem("user");
export const pubPassword = sessionStorage.getItem("password");

const state = {
  songQueue: [],
  playlists: {},
  history: [],
  songIndex: -1,
  ManualQueue: 0,
  friends: [],
  friendRequestsSent: [],
  friendRequestsReceived: [],
  shareLoc: null,
  intList: null,
  volume: 50,
  autoQueueDistance: 150
};

export default state;