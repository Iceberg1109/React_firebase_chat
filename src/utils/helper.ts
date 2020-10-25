export const generateChannelId = (user1: string, user2: string) => {
  const channelId =
    Math.min(parseInt(user1), parseInt(user2)) +
    "-" +
    Math.max(parseInt(user1), parseInt(user2));
  return channelId;
};

export const generateUserID = () => {
  return new Date().getTime().toString();
};

export const generateUserCharacter = () => {
  const starWarCharacters: Array<string> = [
    "Anakin Skywalker",
    "Luke Skywalker",
    "Darth Vader",
    "Emperor Palpatine",
    "Ben Solo",
    "Baby Yoda",
    "Han Solo",
    "Obi-Wan Kenobi",
    "Qui-Gon Jinn",
    "Rey",
  ];

  return starWarCharacters[Math.floor(Math.random() * 10)];
};
