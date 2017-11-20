module.exports = (sequelize, DataTypes) => {
  const Tags = sequelize.define('tags', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      validate: {
        min: 0
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    color: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    name: {
      singular: 'tag',
      plural: 'tags'
    }
  })
  return Tags
}
