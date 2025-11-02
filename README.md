A database of Minecraft Windows GDK versions. A GitHub action is responsible for adding versions to the database automatically, similar to previous UWP version repos.

Each version will have multiple links available to download from. I have seen a couple of instances where one mirror downloads very slowly while the other downloads normally. If you reference this database from a version switcher or launcher, you should measure the HTTP request time at runtime right before downloading for each link to determine which link to use.
