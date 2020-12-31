const { Sequelize, DataTypes } = require("sequelize");
const db = new Sequelize({ dialect: "sqlite", storage: "db.sqlite" });

// https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
const makeShortId = (length) => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  let result = "";

  for (var i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
};

const link = db.define(
  "link",
  {
    url: {
      type: DataTypes.STRING(2000),
      allowNull: false,
      defaultValue: "",
    },
    shortId: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: "",
    },
  },
  {
    timestamps: true, // created at, updated at
    paranoid: true, // soft deletes
    indexes: [
      {
        unique: true,
        fields: ["shortId"], // the short id should be unique and query-able, index it
      },
    ],
    hooks: {
      beforeCreate: (link) => {
        const shortIdLength = 6;

        link.shortId = makeShortId(shortIdLength);
      },
    },
  }
);

const view = db.define(
  "view",
  {
    ipAddress: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "",
    },
    userAgent: {
      type: DataTypes.STRING(8000),
      allowNull: false,
      defaultValue: "",
    },
  },
  {
    timestamps: true,
    paranoid: true,
  }
);

view.belongsTo(link);
link.hasMany(view);

module.exports = db;
