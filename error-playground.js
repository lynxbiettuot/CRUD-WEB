const ans = (a, b) => {
    if (a && b) {
        return a + b;
    }
    throw Error("Invalid agruments!");
}

// try {
//     console.log(ans(1));
// } catch (err) {
//     console.log("Error occur!")
//     // console.log(err);
// }

console.log(ans(1));
console.log("This work!");